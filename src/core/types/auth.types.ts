export type UserRole = 'admin' | 'player';

export type FunctionalPermission = 'MANAGE_MATCHES' | 'MANAGE_PLAYERS';

export interface SessionPayload {
  userId: string;
  role: UserRole;
  permissions: FunctionalPermission[];
  username: string | null;
  email: string | null;
  iat: number;
  exp: number;
}
