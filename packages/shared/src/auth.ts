export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
  turnstileToken: string;
}
