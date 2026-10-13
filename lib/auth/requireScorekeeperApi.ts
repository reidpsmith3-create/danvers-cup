import "server-only";
import { NextResponse } from "next/server";
import {
  SCOREKEEPER_COOKIE_NAME,
  verifyScorekeeperSession,
} from "@/lib/auth/scorekeeperSession";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/auth/adminSession";
import { isSameOriginRequest } from "@/lib/auth/requestOrigin";

function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return entry?.slice(name.length + 1);
}

export async function requireScorekeeperApi(
  request: Request
): Promise<NextResponse | null> {
  const scorekeeperToken = getCookie(request, SCOREKEEPER_COOKIE_NAME);
  const adminToken = getCookie(request, ADMIN_COOKIE_NAME);

  const authorized =
    (await verifyScorekeeperSession(scorekeeperToken)) ||
    (await verifyAdminSession(adminToken));

  if (!authorized) {
    return NextResponse.json(
      { error: "Scorekeeper PIN required." },
      { status: 401 }
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403 }
    );
  }

  return null;
}
