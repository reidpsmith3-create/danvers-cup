import { isSameOriginRequest } from "@/lib/auth/requestOrigin";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_DURATION,
  createAdminSession,
} from "@/lib/auth/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function passwordsMatch(provided: string, expected: string) {
  const providedHash = createHash("sha256")
    .update(provided)
    .digest();

  const expectedHash = createHash("sha256")
    .update(expected)
    .digest();

  return timingSafeEqual(providedHash, expectedHash);
}

function getIpHash(request: NextRequest) {
  // Vercel supplies this header at its trusted network edge.
  // Do not use a client-provided X-Forwarded-For chain.
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.ip ||
    "unknown";

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("Admin session secret is missing.");
  }

  return createHash("sha256")
    .update(`${secret}:${ip}`)
    .digest("hex");
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 }
    );
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 }
    );
  }

  let password: unknown;

  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  if (typeof password !== "string") {
    return NextResponse.json(
      { error: "Invalid password." },
      { status: 400 }
    );
  }

  const isCorrect = passwordsMatch(password, configuredPassword);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: allowed, error } = await supabaseAdmin.rpc(
      "check_admin_login_limit",
      {
        p_ip_hash: getIpHash(request),
        p_is_success: isCorrect,
      }
    );

    if (error) {
      console.error("Admin login rate-limit error:", error.message);

      return NextResponse.json(
        { error: "Login temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    if (allowed !== true) {
      return NextResponse.json(
        {
          error: "Too many failed login attempts. Try again in 15 minutes.",
        },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Admin login security error:", error);

    return NextResponse.json(
      { error: "Login temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  if (!isCorrect) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 }
    );
  }

  const token = await createAdminSession();
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION,
  });

  return response;
}
