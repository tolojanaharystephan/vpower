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
  mode: 'client' | 'vblink';
  gameId: string;
  slug: string;
  title: string;
  sessionId: string;
  launchUrl: string;
  message: string;
  vblinkAccount?: string;
  vblinkPassword?: string;
  requiresManualLogin?: boolean;
};

export type WalletBalance = {
  balanceCents: number;
  balance: string;
  currency: string;
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

/** Enter partner casino VBlink (Bitsky-style): wallet → deposit → Game Mainpage. */
export async function enterVblink(accessToken: string): Promise<LaunchSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/platforms/vblink/enter`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<LaunchSession>;
}

export async function getWallet(accessToken: string): Promise<WalletBalance> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/wallet/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<WalletBalance>;
}

/** Dev-only top-up until Stripe/LOT2 payments. */
export async function devCreditWallet(
  accessToken: string,
  amountCents = 10_000,
): Promise<WalletBalance & { creditedCents: number }> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/wallet/dev-credit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amountCents }),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<WalletBalance & { creditedCents: number }>;
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

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high';
export type MessageAuthorType = 'user' | 'staff' | 'bot';

export type SupportMessage = {
  id: string;
  ticketId: string;
  userId: string;
  authorType: MessageAuthorType;
  kind?: 'text' | 'voice';
  audioUrl?: string | null;
  body: string;
  translatedBody?: string | null;
  sourceLang?: string | null;
  targetLang?: string | null;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  preferredLang?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  messages?: SupportMessage[];
};

function authJsonHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

export async function listMyTickets(
  accessToken: string,
  params?: { status?: TicketStatus },
): Promise<{ data: SupportTicket[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const res = await fetch(`${getApiBaseUrl()}/api/v1/support/tickets${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<{ data: SupportTicket[]; total: number }>;
}

export async function getMyTicket(
  accessToken: string,
  id: string,
  targetLang?: string,
): Promise<SupportTicket> {
  const query = new URLSearchParams();
  if (targetLang) query.set('targetLang', targetLang);
  const qs = query.toString();
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/support/tickets/${id}${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) await parseError(res);
  return res.json() as Promise<SupportTicket>;
}

export async function createTicket(
  accessToken: string,
  input: { subject: string; body: string; priority?: TicketPriority; preferredLang?: string },
): Promise<SupportTicket> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/support/tickets`, {
    method: 'POST',
    headers: authJsonHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<SupportTicket>;
}

export async function addTicketMessage(
  accessToken: string,
  ticketId: string,
  body: string,
  targetLang?: string,
): Promise<{ ticket: SupportTicket; message: SupportMessage }> {
  const query = new URLSearchParams();
  if (targetLang) query.set('targetLang', targetLang);
  const qs = query.toString();
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/support/tickets/${ticketId}/messages${qs ? `?${qs}` : ''}`,
    {
      method: 'POST',
      headers: authJsonHeaders(accessToken),
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) await parseError(res);
  return res.json() as Promise<{ ticket: SupportTicket; message: SupportMessage }>;
}

export async function addTicketVoice(
  accessToken: string,
  ticketId: string,
  blob: Blob,
  opts?: { caption?: string; targetLang?: string },
): Promise<{ ticket: SupportTicket; message: SupportMessage }> {
  const query = new URLSearchParams();
  if (opts?.targetLang) query.set('targetLang', opts.targetLang);
  const qs = query.toString();
  const form = new FormData();
  form.append('audio', blob, `voice-${Date.now()}.webm`);
  if (opts?.caption) form.append('caption', opts.caption);
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/support/tickets/${ticketId}/messages/voice${qs ? `?${qs}` : ''}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    },
  );
  if (!res.ok) await parseError(res);
  return res.json() as Promise<{ ticket: SupportTicket; message: SupportMessage }>;
}

export type BotChatReply = {
  answer: string;
  matched: boolean;
  faqId: string | null;
  question: string | null;
  suggestHuman: boolean;
};

export async function chatSupportBot(
  accessToken: string,
  input: { message: string; locale?: string },
): Promise<BotChatReply> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/support/bot/chat`, {
    method: 'POST',
    headers: authJsonHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<BotChatReply>;
}

export async function escalateSupportBot(
  accessToken: string,
  input: {
    message: string;
    subject?: string;
    preferredLang?: string;
    botAnswer?: string;
  },
): Promise<SupportTicket> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/support/bot/escalate`, {
    method: 'POST',
    headers: authJsonHeaders(accessToken),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<SupportTicket>;
}

export async function translateTicketMessage(
  accessToken: string,
  ticketId: string,
  messageId: string,
  targetLang: string,
): Promise<SupportMessage> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/support/tickets/${ticketId}/messages/${messageId}/translate`,
    {
      method: 'POST',
      headers: authJsonHeaders(accessToken),
      body: JSON.stringify({ targetLang }),
    },
  );
  if (!res.ok) await parseError(res);
  return res.json() as Promise<SupportMessage>;
}

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
};

export async function listNotifications(
  accessToken: string,
): Promise<AppNotification[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  return res.json() as Promise<AppNotification[]>;
}

export async function unreadNotificationCount(accessToken: string): Promise<number> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
  const json = (await res.json()) as { count: number };
  return json.count;
}

export async function markNotificationRead(accessToken: string, id: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
}

export async function markAllNotificationsRead(accessToken: string) {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) await parseError(res);
}

