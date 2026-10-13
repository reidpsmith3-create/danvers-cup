import "server-only";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/auth/adminSession";
import { isSameOriginRequest } from "@/lib/auth/requestOrigin";

export async function requireAdminApi(
  request: Request
): Promise<NextResponse | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(ADMIN_COOKIE_NAME.length + 1);

  if (!(await verifyAdminSession(token))) {
    return NextResponse.json(
      { error: "Unauthorized. Admin login required." },
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
