export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin || fetchSite !== "same-origin") {
    return false;
  }

  try {
    const originUrl = new URL(origin);

    if (originUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return false;
    }

    // Only allow the production domain or this Codespace preview.
    const allowedHosts = [
      "danvers-cup.vercel.app",
      "studious-orbit-r7g477v6g796hxjgr-3000.app.github.dev",
    ];

    if (process.env.NODE_ENV !== "production") {
      allowedHosts.push("localhost:3000", "127.0.0.1:3000");
    }

    return allowedHosts.includes(originUrl.host);
  } catch {
    return false;
  }
}
