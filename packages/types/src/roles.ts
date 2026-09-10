/** Conceptual RBAC roles — enforced on the API. */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  /** Room-scoped ops agent (one or more partner salles). */
  ROOM_AGENT: 'ROOM_AGENT',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
