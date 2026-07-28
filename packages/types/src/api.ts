export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
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

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};
