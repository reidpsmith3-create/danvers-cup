import "server-only";
import { SignJWT, jwtVerify } from "jose";

export const SCOREKEEPER_COOKIE_NAME = "danvers_scorekeeper_session";

const SESSION_DURATION = 60 * 60 * 24 * 7;

function getSessionKey(): Uint8Array {
  const secret = process.env.SCORE_ENTRY_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Scorekeeper session secret is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function createScorekeeperSession(): Promise<string> {
  return new SignJWT({ role: "scorekeeper" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSessionKey());
}

export async function verifyScorekeeperSession(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    return payload.role === "scorekeeper";
  } catch {
    return false;
  }
}
