import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/auth/adminSession";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith("/api/admin/");
  const isAdminPage =
    pathname === "/admin" || pathname.startsWith("/admin/");

  const isLoginPage = pathname === "/admin/login";

  if (!isAdminApi && !isAdminPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = await verifyAdminSession(token);

  if (isLoginPage) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json(
      { error: "Unauthorized. Admin login required." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
