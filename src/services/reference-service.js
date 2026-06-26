import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

function readJson(fileName, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));
  } catch (error) {
    console.error(`Cannot read ${fileName}:`, error.message);
    return fallback;
  }
}

export function loadReference() {
  const stats = readJson('reference-summary.json', {});
  const modules = readJson('module-map.json', []);
  const logs = readJson('log-error-summary.json', {});
  return {
    stats,
    modules: modules.sort((a, b) => a.priority - b.priority || a.title_bg.localeCompare(b.title_bg, 'bg')),
    logs,
  };
}

export function findModule(moduleId) {
  return loadReference().modules.find((module) => module.id === moduleId);
}
