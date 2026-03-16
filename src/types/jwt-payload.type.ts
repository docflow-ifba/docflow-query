export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/** Shape of req.user after Passport JWT strategy transforms the payload */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}
