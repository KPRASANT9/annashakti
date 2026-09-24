import { NextRequest, NextResponse } from "next/server";

/**
 * Serve the original Annashakti kitchen homepage intact from /public/home.html.
 * Tech surfaces (/lab, /whoop, /science) stay on the Next App Router.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || pathname === "/index.html") {
    return NextResponse.rewrite(new URL("/home.html", request.url));
  }

  if (pathname === "/kitchen" || pathname === "/kitchen/") {
    return NextResponse.rewrite(new URL("/kitchen.html", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/index.html", "/kitchen", "/kitchen/"],
};
