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

export type LaunchSession = {
  mode: 'mock' | 'client';
  gameId: string;
  slug: string;
  title: string;
  sessionId: string;
  launchUrl: string;
  message: string;
};

export type FavoriteGame = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  accent?: string | null;
  provider: { id: string; name: string; slug: string };
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
};

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};

async function parseError(res: Response): Promise<never> {
  let body: ApiError | undefined;
  try {
    body = (await res.json()) as ApiError;
  } catch {
    /* ignore */
  }
  throw new Error(body?.message ?? `Request failed (${res.status})`);
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AuthResponse>;
}

export async function loginUser(input: {
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

const ACCESS_KEY = 'vp_access_token';
const REFRESH_KEY = 'vp_refresh_token';

export function persistTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<MeResponse>;
}

export async function updateMe(
  accessToken: string,
  input: { firstName?: string; lastName?: string },
): Promise<MeResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<MeResponse>;
}

export async function logoutUser(refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    /* ignore */
  }
}

export async function launchGame(
  accessToken: string,
  gameId: string,
  locale?: string,
): Promise<LaunchSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/games/${gameId}/launch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale }),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<LaunchSession>;
}

export async function listFavorites(accessToken: string): Promise<FavoriteGame[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me/favorites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<FavoriteGame[]>;
}

export async function addFavorite(accessToken: string, gameId: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me/favorites/${gameId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
}

export async function removeFavorite(accessToken: string, gameId: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/users/me/favorites/${gameId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
}
