import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "danvers_admin_session";
export const ADMIN_SESSION_DURATION = 60 * 60 * 24 * 7;

function getSessionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must contain at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionKey());
}

export async function verifyAdminSession(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    return payload.role === "admin";
  } catch {
    return false;
  }
}
