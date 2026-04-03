import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";
import { staffGateHref, STAFF_PUBLIC_PREFIX } from "@/lib/staff-paths";

const PROTECTED_PATHS = [
  "/dashboard",
  "/clubs",
  "/events",
  "/gigs",
  "/profile",
  "/explore",
  "/notifications",
  "/e-clubs",
];
const AUTH_PATHS = ["/login", "/register", "/club-header/login", "/club-header/register"];

function isStaffGatePath(pathname: string) {
  const publicGate = `${STAFF_PUBLIC_PREFIX}/gate`;
  return (
    pathname === publicGate || 
    pathname.startsWith(`${publicGate}/`) ||
    pathname === "/staff-gate-internal" ||
    pathname.startsWith("/staff-gate-internal/")
  );
}

function isStaffPanelPath(pathname: string) {
  if (isStaffGatePath(pathname)) return false;
  return (
    pathname === STAFF_PUBLIC_PREFIX || 
    pathname.startsWith(`${STAFF_PUBLIC_PREFIX}/`) ||
    pathname === "/staff-panel-internal" ||
    pathname.startsWith("/staff-panel-internal/")
  );
}

function isLegacyAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isInternalStaffPath(pathname: string) {
  return (
    pathname.startsWith("/staff-panel-internal") ||
    pathname.startsWith("/staff-gate-internal")
  );
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("occ-token")?.value;
  const { pathname, search } = req.nextUrl;
  const reauthRequested = req.nextUrl.searchParams.get("reauth") === "1";

  if (isLegacyAdminPath(pathname) || isInternalStaffPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isStaffPanel = isStaffPanelPath(pathname);
  const isStaffGate = isStaffGatePath(pathname);
  const isHeaderPath = pathname.startsWith("/header");
  const isPendingPath = pathname.startsWith("/pending");
  const requiresAuth = isProtected || isStaffPanel || isHeaderPath || isPendingPath;

  if (isStaffGate && token) {
    try {
      const payload = await verifyAuthToken(token);
      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL(STAFF_PUBLIC_PREFIX, req.url));
      }
    } catch {
      /* fall through */
    }
  }

  if (requiresAuth) {
    if (!token) {
      if (isStaffPanel) {
        const gate = new URL(staffGateHref(), req.url);
        gate.searchParams.set("next", pathname + (search || ""));
        return NextResponse.redirect(gate);
      }
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const payload = await verifyAuthToken(token);
      const role = payload.role;
      const status = payload.approvalStatus;

      if (payload.suspended) {
        const loginUrl = new URL("/login", req.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("occ-token");
        return response;
      }

      if (isStaffPanel && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      if (isHeaderPath) {
        if (role !== "CLUB_HEADER") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        if (status === "PENDING") {
          return NextResponse.redirect(new URL("/pending", req.url));
        }
      }

      if (isPendingPath && role === "CLUB_HEADER" && status === "APPROVED") {
        return NextResponse.redirect(new URL("/header/dashboard", req.url));
      }

      return NextResponse.next();
    } catch {
      if (isStaffPanel) {
        const gate = new URL(staffGateHref(), req.url);
        gate.searchParams.set("next", pathname + (search || ""));
        return NextResponse.redirect(gate);
      }
      const loginUrl = new URL("/login", req.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("occ-token");
      return response;
    }
  }

  if (isAuthPath && reauthRequested) {
    const response = NextResponse.next();
    response.cookies.delete("occ-token");
    return response;
  }

  if (isAuthPath && token) {
    try {
      const payload = await verifyAuthToken(token);
      const role = payload.role;
      const approval = payload.approvalStatus;
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL(STAFF_PUBLIC_PREFIX, req.url));
      }
      if (role === "CLUB_HEADER" && approval === "APPROVED") {
        return NextResponse.redirect(new URL("/header/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

/** Only routes that need auth redirects / staff gates — skips marketing pages & static-like paths. */
export const config = {
  matcher: [
    "/login",
    "/register",
    "/club-header/:path*",
    "/dashboard/:path*",
    "/clubs/:path*",
    "/events/:path*",
    "/gigs/:path*",
    "/profile/:path*",
    "/explore",
    "/explore/:path*",
    "/notifications/:path*",
    "/e-clubs",
    "/e-clubs/:path*",
    "/header/:path*",
    "/pending/:path*",
    "/admin",
    "/admin/:path*",
    // Must match default NEXT_PUBLIC_OCC_STAFF_PREFIX; update both if you change the env prefix.
    "/k9xm2p7qv4nw8-stf",
    "/k9xm2p7qv4nw8-stf/:path*",
    "/staff-gate-internal",
    "/staff-gate-internal/:path*",
    "/staff-panel-internal",
    "/staff-panel-internal/:path*",
  ],
};
