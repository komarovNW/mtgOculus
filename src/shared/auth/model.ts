export type AuthPermission = 'tournament:create';

export type AuthRole = 'admin';

export type AuthUser = {
  id: string;
  login: string;
  name: string;
  role: AuthRole;
  permissions: AuthPermission[];
};

export type AuthSession = {
  token: string;
  signedAt: string;
  user: AuthUser;
};

export type SignInPayload = {
  login: string;
  password: string;
};
