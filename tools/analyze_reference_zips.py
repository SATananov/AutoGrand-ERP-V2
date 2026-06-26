#!/usr/bin/env python3
"""
AutoGrand ERP reference analyzer.

Reads one or more Moneta/Client ZIP files as reference input and writes generated
reports for the new AutoGrand rebuild. It never extracts or executes binaries.

Default output is safe for project documentation. When --include-private-log-data
is used, the tool also writes a private folder with raw diagnostic log lines and
identifier candidates from the user's own business object. Keep that folder local.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

BUSINESS_MODULES = {
    "BasePackage": ("base", "ERP основа", "src/modules/base", 1),
    "NomenclaturesPackage": ("nomenclatures", "Номенклатури", "src/modules/nomenclatures", 1),
    "SalesPackage": ("sales", "Продажби", "src/modules/sales", 1),
    "InventoryPackage": ("inventory", "Склад", "src/modules/inventory", 1),
    "PurchasePackage": ("purchase", "Доставки", "src/modules/purchase", 2),
    "AccountingPackage": ("accounting", "Счетоводство", "src/modules/accounting", 2),
    "CRMPackage": ("crm", "CRM", "src/modules/crm", 2),
    "CommercePackage": ("commerce", "Търговия", "src/modules/commerce", 2),
    "ServicePackage": ("service", "Сервиз", "src/modules/service", 3),
    "VehiclePackage": ("vehicles", "Автомобили", "src/modules/vehicles", 3),
    "ProductionPackage": ("production", "Производство", "src/modules/production", 4),
    "FixedAssetPackage": ("fixed-assets", "Дълготрайни активи", "src/modules/fixed-assets", 4),
    "ReservPackage": ("reservations", "Резервации", "src/modules/reservations", 4),
    "TourPackage": ("tour", "Турове", "src/modules/tour", 5),
    "JobPackage": ("jobs", "Задачи и операции", "src/modules/jobs", 5),
    "DevicePackage": ("devices", "Устройства", "src/modules/devices", 5),
    "AdvancedPackage": ("advanced", "Разширени функции", "src/modules/advanced", 5),
}

PURPOSES = {
    "base": "Обща основа за прозорци, документи, общи компоненти и връзка към клиента.",
    "nomenclatures": "Клиенти, артикули, групи, мерни единици, складове, ценови листи и базови справочници.",
    "sales": "Продажби, документи за продажба, фактури, ценови листи, клиентски документи и търговски процес.",
    "inventory": "Складови наличности, движения, артикули, складови документи, доставки към склад.",
    "purchase": "Доставчици, покупки, входящи документи, заявки, приемане и връзка със склада.",
    "accounting": "Фактури, счетоводни операции, финансови справки и връзка с търговските документи.",
    "crm": "Контакти, клиенти, комуникация, търговски взаимоотношения и клиентска история.",
    "commerce": "Общи търговски процеси между продажби, покупки, ценообразуване и документи.",
    "service": "Сервизни заявки, ремонти, сервизна история, операции и услуги.",
    "vehicles": "Автомобилни данни, регистрационни номера, VIN, сервизни и търговски връзки.",
    "production": "Производствени процеси, операции, материали и технологични карти.",
    "fixed-assets": "Активи, амортизации, инвентаризация и връзка със счетоводство.",
    "reservations": "Резервиране на ресурси, стоки, услуги или обекти според бизнес процеса.",
    "tour": "Специализиран модул от reference клиента; анализира се след основните ERP модули.",
    "jobs": "Вътрешни задачи, операции, работни процеси или job записи според reference клиента.",
    "devices": "Връзка с устройства, периферия, касови/четящи/комуникационни компоненти.",
    "advanced": "Разширени помощни функции от reference клиента; не влиза в първия CRUD етап.",
}

BINARY_EXTENSIONS = {".exe", ".exe_bak", ".dll", ".dll_bak", ".bpl", ".bpl_bak", ".ocx", ".com", ".sys"}
SOURCE_EXTENSIONS = {".pas", ".dfm", ".dpr", ".dpk", ".js", ".ts", ".py", ".html", ".css", ".sql"}

ERROR_PATTERNS = {
    "Access violation": ["access violation"],
    "ParentConnection is not assigned": ["parentconnection is not assigned", "parentconnection"],
    "Dataset not in edit or insert mode": ["dataset not in edit or insert mode"],
    "Dataset issue": ["dataset", "clientdataset"],
    "Connection issue": ["connection", "socket", "connect"],
    "Server issue": ["server", "remote", "rdmmoneta"],
    "SQL/Database issue": [" sql ", "database", "ado", "db", "query"],
    "Validation issue": ["required", "invalid", "невалид", "липсва", "cannot"],
    "Exception": ["exception", "грешка", "error"],
    "Transaction issue": ["transaction", "commit", "rollback"],
}

SENSITIVE_REPLACEMENTS = [
    (re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "[EMAIL]"),
    (re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b"), "[IP]"),
    (re.compile(r"\b[A-Za-z]:\\[^\s\]]+"), "[PATH]"),
    (re.compile(r"https?://\S+", re.I), "[URL]"),
    (re.compile(r"\b(?:user|username|login|operator|потребител|оператор)\s*[:=]\s*[^\s,;\]]+", re.I), "USER=[USER]"),
    (re.compile(r"\b\d{9,}\b"), "[NUMBER]"),
]

IDENTIFIER_PATTERNS = {
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "ip_or_host_port": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b"),
    "windows_path": re.compile(r"\b[A-Za-z]:\\[^\s\]]+"),
    "user_assignment": re.compile(r"\b(?:user|username|login|operator|потребител|оператор)\s*[:=]\s*([^\s,;\]]+)", re.I),
    "rdm_or_class": re.compile(r"\b(?:T[A-Za-z][A-Za-z0-9_]{3,}|rdm[A-Za-z0-9_]+|[A-Za-z0-9_]+Package)\b"),
}

@dataclass
class PrivateRows:
    diagnostic_rows: list[dict] = field(default_factory=list)
    identifier_rows: list[dict] = field(default_factory=list)

@dataclass
class SourceAnalysis:
    audit: dict
    packages: list[dict]
    module_names: set[str]
    log_summary: dict
    special_notes: list[str]
    private: PrivateRows = field(default_factory=PrivateRows)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def decode_text(data: bytes) -> str:
    for encoding in ("utf-8", "cp1251", "cp1252", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1", "ignore")


def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("_") or "source"


def redact(value: str) -> str:
    result = value
    for pattern, repl in SENSITIVE_REPLACEMENTS:
        result = pattern.sub(repl, result)
    return result


def line_categories(line: str) -> set[str]:
    low = f" {line.lower()} "
    categories: set[str] = set()
    for label, needles in ERROR_PATTERNS.items():
        if any(needle in low for needle in needles):
            categories.add(label)
    return categories


def should_count_line(line: str) -> bool:
    low = line.lower()
    return any(token in low for token in (
        "[error]", "[грешка]", "error", "грешка", "exception", "access violation",
        "dataset", "connection", "server", "parentconnection", "cannot", "failed",
        "transaction", "sql", "database",
    ))


def signature_for_line(line: str) -> str:
    normalized = redact(line.lower())
    normalized = re.sub(r"\b\d+\b", "#", normalized)
    normalized = re.sub(r"'[^']{1,80}'", "'[VALUE]'", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    digest = hashlib.sha1(normalized.encode("utf-8", "ignore")).hexdigest()[:10].upper()
    cats = sorted(line_categories(line))
    category = cats[0] if cats else "Diagnostic"
    return f"{category}::{digest}"


def extract_identifiers(line: str) -> list[tuple[str, str]]:
    values: list[tuple[str, str]] = []
    for kind, pattern in IDENTIFIER_PATTERNS.items():
        for match in pattern.finditer(line):
            value = match.group(1) if kind == "user_assignment" and match.groups() else match.group(0)
            value = value.strip("'\" [](){}<>,;:")
            if len(value) >= 3:
                values.append((kind, value))
    return values


def analyze_zip(zip_path: Path, include_private: bool = False, max_private_rows_per_source: int = 200000) -> SourceAnalysis:
    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP not found: {zip_path}")

    extension_counts: Counter[str] = Counter()
    packages: list[dict] = []
    module_names: set[str] = set()
    dangerous_paths: list[str] = []
    source_like_files: list[str] = []
    special_notes: list[str] = []
    log_dates: list[str] = []
    log_files = 0
    diagnostic_lines = 0
    pattern_counts: Counter[str] = Counter()
    signature_counts: Counter[str] = Counter()
    log_file_category_hits: Counter[str] = Counter()
    private_rows = PrivateRows()
    identifier_counts: Counter[tuple[str, str]] = Counter()

    with zipfile.ZipFile(zip_path) as z:
        bad_crc = z.testzip()
        infos = z.infolist()
        for info in infos:
            norm = info.filename.replace("\\", "/")
            lower_norm = norm.lower()
            if norm.startswith("/") or any(part == ".." for part in norm.split("/")):
                dangerous_paths.append(info.filename)

            ext = "<dir>" if norm.endswith("/") else Path(norm).suffix.lower() or "<none>"
            extension_counts[ext] += 1
            base = Path(norm).name
            lower_base = base.lower()

            if ext in SOURCE_EXTENSIONS:
                source_like_files.append(info.filename)

            if lower_base.endswith((".bpl", ".bpl_bak")):
                package = re.sub(r"\.bpl(_bak)?$", "", base, flags=re.I)
                module_names.add(package)
                packages.append({
                    "source_zip": zip_path.name,
                    "package": package,
                    "filename": info.filename,
                    "kind": "backup" if lower_base.endswith("_bak") else "active",
                    "size_bytes": info.file_size,
                })

            if lower_base in {"monetaclient.exe", "monetaclient.exe_bak"}:
                special_notes.append(f"Found {base}: deployed Moneta client binary; not copied or executed.")
            if lower_base == "monetahelp.chm":
                special_notes.append("Found MonetaHelp.chm: help/reference artifact; can guide screen terminology later.")
            if lower_base == "license.rtf":
                special_notes.append("Found License.rtf: keep license context in mind; do not copy proprietary runtime content.")
            if lower_base.startswith("zipmaster") and lower_base.endswith((".bpl", ".bpl_bak")):
                special_notes.append(f"Found {base}: Delphi ZipMaster runtime package; not needed for Node.js ZIP handling.")

            if (lower_norm.endswith(".log") or "log" in lower_norm) and not info.is_dir() and info.file_size <= 8 * 1024 * 1024:
                try:
                    text = decode_text(z.read(info))
                except Exception:
                    continue
                date_match = re.search(r"(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)", info.filename)
                if date_match:
                    log_dates.append(f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}")
                log_files += 1
                file_categories: set[str] = set()
                for line_no, raw_line in enumerate(text.splitlines(), start=1):
                    line = raw_line.strip()
                    if not line:
                        continue
                    if include_private:
                        for kind, value in extract_identifiers(line):
                            identifier_counts[(kind, value)] += 1
                    if not should_count_line(line):
                        continue
                    diagnostic_lines += 1
                    categories = line_categories(line) or {"Diagnostic"}
                    for category in categories:
                        pattern_counts[category] += 1
                        file_categories.add(category)
                    sig = signature_for_line(line)
                    signature_counts[sig] += 1
                    if include_private and len(private_rows.diagnostic_rows) < max_private_rows_per_source:
                        private_rows.diagnostic_rows.append({
                            "source_zip": zip_path.name,
                            "log_file": info.filename,
                            "line_no": line_no,
                            "categories": " | ".join(sorted(categories)),
                            "signature": sig,
                            "raw_line": line,
                        })
                for category in file_categories:
                    log_file_category_hits[category] += 1

    if include_private:
        for (kind, value), count in identifier_counts.most_common(10000):
            private_rows.identifier_rows.append({
                "source_zip": zip_path.name,
                "kind": kind,
                "value": value,
                "count": count,
            })

    binary_entries = sum(extension_counts.get(ext, 0) for ext in BINARY_EXTENSIONS)
    audit = {
        "source_zip": zip_path.name,
        "sha256": sha256_file(zip_path),
        "zip_size_bytes": zip_path.stat().st_size,
        "total_entries": len(infos),
        "total_uncompressed_bytes": sum(i.file_size for i in infos),
        "extension_counts": dict(extension_counts.most_common()),
        "binary_entries": binary_entries,
        "source_like_files_count": len(source_like_files),
        "source_like_files_sample": source_like_files[:20],
        "unique_bpl_packages": len(module_names),
        "log_files": log_files,
        "log_date_min": min(log_dates) if log_dates else None,
        "log_date_max": max(log_dates) if log_dates else None,
        "bad_crc_entry": bad_crc,
        "dangerous_paths_count": len(dangerous_paths),
        "private_log_data_generated": include_private,
        "policy": "metadata-only-reference-no-binaries-copied-no-executables-run",
    }
    log_summary = {
        "source_zip": zip_path.name,
        "log_files": log_files,
        "date_min": audit["log_date_min"],
        "date_max": audit["log_date_max"],
        "matched_diagnostic_lines": diagnostic_lines,
        "patterns": dict(pattern_counts.most_common()),
        "files_with_pattern": dict(log_file_category_hits.most_common()),
        "top_error_signatures": [
            {"signature": key, "count": count, "privacy": "raw line stored only in docs/reference/private when enabled"}
            for key, count in signature_counts.most_common(60)
        ],
    }
    return SourceAnalysis(audit, packages, module_names, log_summary, sorted(set(special_notes)), private_rows)


def build_module_map(module_names_by_source: dict[str, set[str]]) -> list[dict]:
    all_names = set().union(*module_names_by_source.values()) if module_names_by_source else set()
    modules: list[dict] = []
    for package, (module_id, title, target_path, priority) in BUSINESS_MODULES.items():
        if package in all_names:
            found_in = [source for source, names in module_names_by_source.items() if package in names]
            modules.append({
                "id": module_id,
                "package": package,
                "title_bg": title,
                "target_path": target_path,
                "priority": priority,
                "purpose_bg": PURPOSES[module_id],
                "status": "reference-mapped",
                "found_in_sources": found_in,
            })
    return sorted(modules, key=lambda item: (item["priority"], item["title_bg"]))


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_private_outputs(sources: list[SourceAnalysis], private_dir: Path) -> None:
    private_dir.mkdir(parents=True, exist_ok=True)
    diagnostics = [row for source in sources for row in source.private.diagnostic_rows]
    identifiers = [row for source in sources for row in source.private.identifier_rows]
    write_csv(private_dir / "private_log_diagnostic_lines.csv", diagnostics, ["source_zip", "log_file", "line_no", "categories", "signature", "raw_line"])
    write_csv(private_dir / "private_log_identifiers.csv", identifiers, ["source_zip", "kind", "value", "count"])
    readme = """# PRIVATE — Moneta log data

Тази папка е само за локална работа по твоя AutoGrand ERP проект.

Тук има реални диагностични редове и identifier кандидати от логовете на твоя обект. Не я публикувай в GitHub, не я качвай в публичен deploy и не я пращай на външни хора.

Файлове:

- `private_log_diagnostic_lines.csv` — сурови diagnostic/error редове от логовете, с категория и сигнатура.
- `private_log_identifiers.csv` — намерени email/IP/path/user/class кандидати и брой срещания.

Главните app екрани използват само безопасните summary файлове от `docs/reference/generated/`.
"""
    (private_dir / "README_PRIVATE_BG.md").write_text(readme, encoding="utf-8")


def write_outputs(sources: list[SourceAnalysis], out_dir: Path, private_dir: Path | None = None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    audits_dir = out_dir / "source_audits"
    audits_dir.mkdir(parents=True, exist_ok=True)

    module_names_by_source = {source.audit["source_zip"]: source.module_names for source in sources}
    module_map = build_module_map(module_names_by_source)
    all_packages = [package for source in sources for package in source.packages]
    private_enabled = private_dir is not None

    totals = {
        "step": "0.1-zipmaster-reference-analyzer",
        "source_count": len(sources),
        "source_zips": [source.audit["source_zip"] for source in sources],
        "total_entries": sum(source.audit["total_entries"] for source in sources),
        "zip_size_bytes": sum(source.audit["zip_size_bytes"] for source in sources),
        "total_uncompressed_bytes": sum(source.audit["total_uncompressed_bytes"] for source in sources),
        "unique_bpl_packages": len(set(package["package"] for package in all_packages)),
        "mapped_business_modules": len(module_map),
        "log_files": sum(source.audit["log_files"] for source in sources),
        "bad_crc_entries": [source.audit for source in sources if source.audit["bad_crc_entry"]],
        "dangerous_paths_count": sum(source.audit["dangerous_paths_count"] for source in sources),
        "private_log_data_generated": private_enabled,
        "privacy_policy": "Public generated docs are safe summaries. Private raw diagnostic logs are generated only under docs/reference/private when enabled by the owner.",
        "binary_policy": "Reference ZIPs are analyzed as metadata only. Executable/runtime binaries are never copied into the app and never executed.",
    }

    combined_patterns: Counter[str] = Counter()
    combined_files_with_pattern: Counter[str] = Counter()
    combined_signatures: Counter[str] = Counter()
    for source in sources:
        combined_patterns.update(source.log_summary.get("patterns", {}))
        combined_files_with_pattern.update(source.log_summary.get("files_with_pattern", {}))
        for signature in source.log_summary.get("top_error_signatures", []):
            combined_signatures[signature["signature"]] += signature["count"]

    date_values = [value for source in sources for value in (source.log_summary.get("date_min"), source.log_summary.get("date_max")) if value]
    combined_log_summary = {
        "privacy_policy": totals["privacy_policy"],
        "log_files": totals["log_files"],
        "date_min": min(date_values) if date_values else None,
        "date_max": max(date_values) if date_values else None,
        "matched_diagnostic_lines": sum(source.log_summary.get("matched_diagnostic_lines", 0) for source in sources),
        "patterns": dict(combined_patterns.most_common()),
        "files_with_pattern": dict(combined_files_with_pattern.most_common()),
        "top_error_signatures": [
            {"signature": key, "count": count, "privacy": "raw line stored only in docs/reference/private when enabled"}
            for key, count in combined_signatures.most_common(80)
        ],
        "sources": [source.log_summary for source in sources],
    }

    for source in sources:
        (audits_dir / f"{safe_name(source.audit['source_zip'])}.json").write_text(json.dumps(source.audit, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "reference_sources.json").write_text(json.dumps([source.audit for source in sources], ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "zip_audit.json").write_text(json.dumps(totals, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "module_map.json").write_text(json.dumps(module_map, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "log_error_summary.json").write_text(json.dumps(combined_log_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    write_csv(out_dir / "package_inventory.csv", all_packages, ["source_zip", "package", "filename", "kind", "size_bytes"])

    notes: list[str] = []
    for source in sources:
        notes.append(f"## {source.audit['source_zip']}")
        if source.special_notes:
            notes.extend(f"- {note}" for note in source.special_notes)
        else:
            notes.append("- No special ZipMaster/help/license artifacts detected.")
        notes.append("")
    (out_dir / "zipmaster_reference_notes.md").write_text("# ZipMaster / Moneta Reference Notes\n\n" + "\n".join(notes), encoding="utf-8")

    if private_dir:
        write_private_outputs(sources, private_dir)

    summary_lines = [
        "# AutoGrand Moneta Reference Summary — Step 0.1",
        "",
        "Този файл е генериран от двата reference ZIP-а. Бинарни файлове не са копирани и не са изпълнявани.",
        "",
        "## Private data rule",
        "",
        "Логовете са от реален твой обект. Безопасните summary отчети са в `docs/reference/generated/`. Суровите diagnostic редове и identifier кандидати са отделени в `docs/reference/private/` и са само за локална работа.",
        "",
        "## Sources",
        "",
    ]
    for source in sources:
        audit = source.audit
        summary_lines.extend([
            f"- `{audit['source_zip']}`",
            f"  - SHA256: `{audit['sha256']}`",
            f"  - entries: {audit['total_entries']}",
            f"  - uncompressed bytes: {audit['total_uncompressed_bytes']}",
            f"  - unique BPL packages: {audit['unique_bpl_packages']}",
            f"  - log files: {audit['log_files']}",
            f"  - bad CRC entry: {audit['bad_crc_entry']}",
            f"  - dangerous paths: {audit['dangerous_paths_count']}",
        ])
    summary_lines.extend(["", "## Mapped ERP modules", ""])
    summary_lines.extend(f"- `{module['package']}` → **{module['title_bg']}** → `{module['target_path']}`" for module in module_map)
    summary_lines.extend(["", "## Top diagnostic categories", ""])
    summary_lines.extend(f"- {key}: {value}" for key, value in combined_patterns.most_common(20))
    summary_lines.extend([
        "", "## Generated files", "",
        "- `zip_audit.json`",
        "- `reference_sources.json`",
        "- `module_map.json`",
        "- `log_error_summary.json`",
        "- `package_inventory.csv`",
        "- `zipmaster_reference_notes.md`",
        "- `../private/private_log_diagnostic_lines.csv`",
        "- `../private/private_log_identifiers.csv`",
    ])
    (out_dir / "client_reference_summary.md").write_text("\n".join(summary_lines), encoding="utf-8")


def analyze(zip_paths: Iterable[Path], out_dir: Path, include_private: bool, private_out: Path | None) -> None:
    private_dir = private_out if include_private else None
    sources = [analyze_zip(path, include_private=include_private) for path in zip_paths]
    write_outputs(sources, out_dir, private_dir=private_dir)
    print(f"OK: generated reference reports for {len(sources)} source ZIP(s) in {out_dir}")
    if private_dir:
        print(f"OK: generated private log reports in {private_dir}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", action="append", required=True, help="Path to a reference ZIP. Repeat for multiple ZIPs.")
    parser.add_argument("--out", default="docs/reference/generated")
    parser.add_argument("--include-private-log-data", action="store_true", help="Write raw private diagnostic log reports for local use only.")
    parser.add_argument("--private-out", default="docs/reference/private")
    args = parser.parse_args()
    try:
        analyze([Path(value) for value in args.zip], Path(args.out), args.include_private_log_data, Path(args.private_out))
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
