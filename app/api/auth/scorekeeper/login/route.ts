import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isSameOriginRequest } from "@/lib/auth/requestOrigin";
import {
  createScorekeeperSession,
  SCOREKEEPER_COOKIE_NAME,
} from "@/lib/auth/scorekeeperSession";

export const runtime = "nodejs";

function matchesPin(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const configuredPin = process.env.SCORE_ENTRY_PIN;
  const sessionSecret = process.env.SCORE_ENTRY_SESSION_SECRET;

  if (!configuredPin || !sessionSecret) {
    return NextResponse.json(
      { error: "Score entry is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pin =
    body && typeof body === "object" && "pin" in body
      ? (body as { pin?: unknown }).pin
      : undefined;

  if (typeof pin !== "string") {
    return NextResponse.json({ error: "PIN required." }, { status: 400 });
  }

  const forwardedIp = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  const ip = forwardedIp || "unknown";

  // Keep scorekeeper attempts separate from Admin login attempts.
  const ipHash = createHash("sha256")
    .update(`scorekeeper:${sessionSecret}:${ip}`)
    .digest("hex");

  const validPin = matchesPin(pin, configuredPin);

  const { data: allowed, error } = await getSupabaseAdmin().rpc(
    "check_admin_login_limit",
    {
      p_ip_hash: ipHash,
      p_is_success: validPin,
    }
  );

  if (error) {
    return NextResponse.json(
      { error: "Login temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  if (!validPin) {
    return NextResponse.json(
      { error: "Incorrect PIN." },
      { status: 401 }
    );
  }

  const token = await createScorekeeperSession();

  const response = NextResponse.json({ success: true });

  response.cookies.set(SCOREKEEPER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
