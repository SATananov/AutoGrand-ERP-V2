import prisma from '../db/prisma.js';
import { DEFAULT_LOCATION_CODE } from '../data/autogrand-foundation.js';

// Uses Prisma UserLocationAccess records to validate object-based login.
const LOGIN_COOKIE_NAME = 'ag_v2_login_context';
const REMEMBER_COOKIE_NAME = 'ag_v2_login_last';
const DEV_PASSWORD = '1234';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 10;
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 60;

function parseCookies(header = '') {
  return String(header || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return cookies;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (key) cookies[key] = decodeURIComponent(value || '');
      return cookies;
    }, {});
}

function encodeContextCookie(payload = {}) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

function decodeContextCookie(value = '') {
  try {
    if (!value) return null;
    const json = Buffer.from(String(value), 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function cookieOptions({ maxAgeSeconds = COOKIE_MAX_AGE_SECONDS } = {}) {
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ].join('; ');
}

export function isPublicLoginPath(req) {
  const path = req.path || '/';
  if (path === '/login' || path === '/logout' || path === '/health') return true;
  if (path.startsWith('/auth/')) return true;
  if (path.startsWith('/public/')) return true;
  return false;
}

export function clearLoginCookies(res) {
  res.setHeader('Set-Cookie', [
    `${LOGIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${REMEMBER_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`
  ]);
}

export function setLoginCookies(res, context = {}) {
  const loginValue = encodeContextCookie({
    userId: context.userId,
    companyId: context.companyId,
    locationId: context.locationId,
    language: context.language || 'bg',
    loggedAt: new Date().toISOString()
  });

  const rememberValue = encodeContextCookie({
    companyId: context.companyId,
    locationId: context.locationId,
    username: context.username,
    language: context.language || 'bg'
  });

  res.setHeader('Set-Cookie', [
    `${LOGIN_COOKIE_NAME}=${encodeURIComponent(loginValue)}; ${cookieOptions()}`,
    `${REMEMBER_COOKIE_NAME}=${encodeURIComponent(rememberValue)}; Path=/; SameSite=Lax; Max-Age=${REMEMBER_MAX_AGE_SECONDS}`
  ]);
}

function textOrDash(value) {
  const text = String(value || '').trim();
  return text || '—';
}

function userDisplayName(user) {
  return user?.employee?.displayName || user?.displayName || user?.username || 'Потребител';
}

function userRoleName(user) {
  return user?.roleTemplate?.name || user?.role || 'Оператор';
}

function permissionCodesForUser(user) {
  const rolePermissions = user?.roleTemplate?.rolePermissions || [];
  const codes = new Set(rolePermissions
    .filter((entry) => entry.allowed !== false)
    .map((entry) => entry.permission?.code)
    .filter(Boolean));

  for (const override of user?.permissionOverrides || []) {
    const code = override.permission?.code;
    if (!code) continue;
    if (override.allowed) codes.add(code);
    else codes.delete(code);
  }

  return Array.from(codes).sort();
}

function locationAccessFor(user, locationId) {
  const selectedId = Number(locationId || 0);
  return (user?.locationAccesses || []).find((entry) => Number(entry.locationId) === selectedId) || null;
}

export async function getLoginOptions(req, selected = {}) {
  const cookies = parseCookies(req?.headers?.cookie || '');
  const remembered = decodeContextCookie(cookies[REMEMBER_COOKIE_NAME] || '') || {};

  const [companies, locations, users] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.companyLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    }),
    prisma.user.findMany({
      where: { isActive: true },
      include: {
        employee: true,
        roleTemplate: true,
        defaultLocation: true,
        locationAccesses: { include: { location: true } }
      },
      orderBy: [{ displayName: 'asc' }, { username: 'asc' }]
    })
  ]);

  const defaultCompany = companies[0] || null;
  const defaultLocation = locations.find((location) => location.code === DEFAULT_LOCATION_CODE)
    || locations.find((location) => location.isDefault)
    || locations[0]
    || null;

  const selectedCompanyId = Number(selected.companyId || remembered.companyId || defaultCompany?.id || 0) || null;
  const selectedLocationId = Number(selected.locationId || remembered.locationId || defaultLocation?.id || 0) || null;
  const selectedUsername = String(selected.username || remembered.username || 'stefan.admin').trim();
  const selectedLanguage = String(selected.language || remembered.language || 'bg').trim() || 'bg';

  return {
    companies: companies.map((company) => ({
      id: company.id,
      code: company.code,
      name: company.name,
      selected: Number(company.id) === Number(selectedCompanyId)
    })),
    locations: locations.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      city: location.city || '',
      type: location.type,
      canLogin: location.canTransfer || location.canSell || location.canHoldStock,
      selected: Number(location.id) === Number(selectedLocationId)
    })),
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: userDisplayName(user),
      fullLabel: `${userDisplayName(user)} · ${user.username} · ${userRoleName(user)}`,
      roleName: userRoleName(user),
      defaultLocationId: user.defaultLocationId || null,
      locationIds: user.locationAccesses.filter((entry) => entry.canLogin).map((entry) => entry.locationId),
      selected: user.username === selectedUsername
    })),
    selectedCompanyId,
    selectedLocationId,
    selectedUsername,
    selectedLanguage,
    languageBgSelected: selectedLanguage !== 'en',
    languageEnSelected: selectedLanguage === 'en',
    devPasswordHint: DEV_PASSWORD
  };
}

async function buildContextFromParts({ userId, companyId, locationId, language = 'bg' } = {}) {
  const user = await prisma.user.findFirst({
    where: { id: Number(userId || 0), isActive: true },
    include: {
      company: true,
      employee: true,
      roleTemplate: { include: { rolePermissions: { include: { permission: true } } } },
      defaultLocation: true,
      locationAccesses: { include: { location: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });

  if (!user) return null;

  const company = user.companyId === Number(companyId)
    ? user.company
    : await prisma.company.findFirst({ where: { id: Number(companyId || user.companyId || 0) } });

  const selectedLocationId = Number(locationId || user.defaultLocationId || 0);
  const access = locationAccessFor(user, selectedLocationId);
  if (!access || !access.canLogin) return null;

  const location = access.location;
  const permissions = permissionCodesForUser(user);

  return {
    isAuthenticated: true,
    userId: user.id,
    username: user.username,
    userName: userDisplayName(user),
    userDisplayName: user.displayName,
    roleCode: user.roleTemplate?.code || user.role || 'OPERATOR',
    roleName: userRoleName(user),
    companyId: company?.id || user.companyId || null,
    companyCode: company?.code || 'AG',
    companyName: company?.name || 'Автогранд ООД',
    locationId: location.id,
    locationCode: location.code,
    locationName: location.name,
    locationCity: location.city || '',
    locationType: location.type,
    language: language || user.language || 'bg',
    permissions,
    permissionText: permissions.join(', '),
    canSell: Boolean(access.canSell),
    canRequestTransfer: Boolean(access.canRequestTransfer),
    canDispatchTransfer: Boolean(access.canDispatchTransfer),
    canReceiveTransfer: Boolean(access.canReceiveTransfer)
  };
}

export async function getRequestLoginContext(req) {
  const cookies = parseCookies(req?.headers?.cookie || '');
  const payload = decodeContextCookie(cookies[LOGIN_COOKIE_NAME] || '');
  if (!payload?.userId || !payload?.locationId) return null;
  return buildContextFromParts(payload);
}

export function contextToViewData(context) {
  if (!context?.isAuthenticated) {
    return {
      isAuthenticated: false,
      companyName: 'Автогранд ООД',
      userName: 'Няма вход',
      currentLocationName: 'Не е избран обект',
      currentLocationCode: '',
      currentRoleName: '—',
      userRoleLabel: 'Няма активна роля',
      sessionLabel: 'Няма активна сесия'
    };
  }

  return {
    isAuthenticated: true,
    companyName: `${context.locationName} · ${context.companyName}`,
    userName: context.userName,
    currentUsername: context.username,
    currentCompanyName: context.companyName,
    currentCompanyCode: context.companyCode,
    currentLocationName: context.locationName,
    currentLocationCode: context.locationCode,
    currentLocationCity: context.locationCity,
    currentRoleName: context.roleName,
    currentRoleCode: context.roleCode,
    userRoleLabel: `${context.userName} · ${context.roleName}`,
    currentLanguage: context.language,
    sessionLabel: `${context.locationName} · ${context.userName} · ${context.roleName}`,
    canSell: context.canSell,
    canRequestTransfer: context.canRequestTransfer,
    canDispatchTransfer: context.canDispatchTransfer,
    canReceiveTransfer: context.canReceiveTransfer
  };
}

export async function authenticateLogin(form = {}) {
  const username = String(form.username || '').trim();
  const password = String(form.password || '').trim();
  const companyId = Number(form.companyId || 0);
  const locationId = Number(form.locationId || 0);
  const language = String(form.language || 'bg').trim() || 'bg';

  if (!username || !companyId || !locationId) {
    return { ok: false, code: 'missing_fields', message: 'Изберете фирма, обект и потребител.' };
  }

  if (password !== DEV_PASSWORD) {
    return { ok: false, code: 'wrong_password', message: `За работната версия използвай парола ${DEV_PASSWORD}.` };
  }

  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
    include: {
      company: true,
      employee: true,
      roleTemplate: { include: { rolePermissions: { include: { permission: true } } } },
      defaultLocation: true,
      locationAccesses: { include: { location: true } },
      permissionOverrides: { include: { permission: true } }
    }
  });

  if (!user) {
    return { ok: false, code: 'user_not_found', message: 'Потребителят не е намерен или е спрян.' };
  }

  if (Number(user.companyId) !== Number(companyId)) {
    return { ok: false, code: 'wrong_company', message: 'Потребителят не е към избраната фирма.' };
  }

  const access = locationAccessFor(user, locationId);
  if (!access || !access.canLogin) {
    return { ok: false, code: 'no_location_access', message: 'Потребителят няма вход в избрания обект.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), language }
  });

  const context = await buildContextFromParts({
    userId: user.id,
    companyId,
    locationId,
    language
  });

  return { ok: true, context };
}
