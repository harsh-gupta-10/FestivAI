import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Skip static assets, internal Next.js requests, and API routes
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Detect app subdomain (e.g. app.festivai.workers.dev, app.localhost:3000)
  const isAppSubdomain = hostname.startsWith("app.") || hostname.startsWith("app-");

  if (isAppSubdomain) {
    // If accessed via app. subdomain, rewrite root to /app and path to /app/path
    if (!url.pathname.startsWith("/app")) {
      const newPath = `/app${url.pathname === "/" ? "" : url.pathname}`;
      url.pathname = newPath;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
