import { getApiBaseUrl } from './utils';

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
  roles: string[];
  permissions: string[];
};

export type MeResponse = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  emailVerifiedAt?: string | null;
  createdAt: string;
  roles: string[];
  permissions: string[];
};

export type AdminOverview = {
  usersTotal: number;
  featureFlags: {
    paymentsEnabled: boolean;
    liveGamesEnabled: boolean;
    translationEnabled: boolean;
  };
  gameProviderMode: string;
  timestamp: string;
};

type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};

const ACCESS_KEY = 'vp_admin_access_token';
const REFRESH_KEY = 'vp_admin_refresh_token';
const SESSION_KEY = 'vp_admin_session';

export const ADMIN_ACCESS_PERMISSION = 'admin:access';

async function parseError(res: Response): Promise<never> {
  let body: ApiError | undefined;
  try {
    body = (await res.json()) as ApiError;
  } catch {
    /* ignore */
  }
  throw new Error(body?.message ?? `Request failed (${res.status})`);
}

export async function loginAdmin(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AuthResponse>;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<MeResponse>;
}

export async function fetchAdminOverview(accessToken: string): Promise<AdminOverview> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AdminOverview>;
}

export async function logoutAdmin(refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    /* ignore network errors on logout */
  }
}

export function persistAdminSession(data: AuthResponse) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, data.accessToken);
  window.localStorage.setItem(REFRESH_KEY, data.refreshToken);
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      user: data.user,
      roles: data.roles,
      permissions: data.permissions,
    }),
  );
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAdminAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getAdminRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function readCachedSession(): {
  user: AuthResponse['user'];
  roles: string[];
  permissions: string[];
} | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      user: AuthResponse['user'];
      roles: string[];
      permissions: string[];
    };
  } catch {
    return null;
  }
}

export function hasAdminAccess(permissions: string[]) {
  return permissions.includes(ADMIN_ACCESS_PERMISSION);
}

export type GameStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type AdminGame = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  accent?: string | null;
  providerId: string;
  categoryId: string;
  status: GameStatus;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  rtp?: number | null;
  volatility?: string | null;
  minBet?: number | null;
  maxBet?: number | null;
  tags?: string[] | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  provider: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
};

export type GameProvider = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type GameCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export type GamePayload = {
  slug: string;
  title: string;
  description?: string;
  accent?: string;
  providerId: string;
  categoryId: string;
  status?: GameStatus;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
};

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export async function listGames(
  accessToken: string,
  params?: { search?: string; status?: GameStatus; page?: number; limit?: number },
): Promise<{ data: AdminGame[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 50));
  query.set('sortBy', 'sortOrder');
  query.set('sortOrder', 'asc');

  const res = await fetch(`${getApiBaseUrl()}/api/v1/games?${query}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<{ data: AdminGame[]; total: number }>;
}

export async function createGame(accessToken: string, payload: GamePayload): Promise<AdminGame> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/games`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AdminGame>;
}

export async function updateGame(
  accessToken: string,
  id: string,
  payload: Partial<GamePayload>,
): Promise<AdminGame> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/games/${id}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AdminGame>;
}

export async function deleteGame(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/games/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!res.ok) await parseError(res);
}

export async function listProviders(accessToken: string): Promise<GameProvider[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/game-providers`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<GameProvider[]>;
}

export async function listCategories(accessToken: string): Promise<GameCategory[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/game-categories`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<GameCategory[]>;
}
