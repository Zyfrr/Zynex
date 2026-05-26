import { verifyAccessToken } from "../modules/auth/auth.tokens";

type AuthRequest = {
  cookies?: Record<string, string>;
  header: (name: string) => string | undefined;
};

export function getUserIdFromRequest(req: AuthRequest) {
  const headerUserId = req.header("x-zynex-user-id");
  if (headerUserId) return headerUserId;

  const token = req.cookies?.ZyNexAccessToken;
  if (!token) return undefined;

  return verifyAccessToken(token).userId;
}
