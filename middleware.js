import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const rules = [["/panel-x9k7", "production"], ["/panel-m3p8", "marketing"]];
const protectedApi = [
  ["/api/designs", ["POST"], "production"],
  ["/api/pod", ["GET", "POST", "PUT", "PATCH", "DELETE"], "production"],
  ["/api/social", ["GET", "POST", "PUT", "PATCH", "DELETE"], "marketing"],
  ["/api/stats", ["GET"], "production"],
  ["/api/products", ["POST", "PUT", "PATCH", "DELETE"], "production"],
  ["/api/orders", ["GET", "PUT", "PATCH", "DELETE"], "production"]
];

function apiAllowed(payload, area) {
  return payload.role === "owner" || payload.area === area;
}

export async function middleware(req) {
  const path = req.nextUrl.pathname, method = req.method;
  const pageRule = rules.find(([prefix]) => path.startsWith(prefix));
  const apiRule = protectedApi.find(([prefix, methods]) => path.startsWith(prefix) && methods.includes(method));
  if (!pageRule && !apiRule) return NextResponse.next();

  const token = req.cookies.get("out_session")?.value;
  if (!token) return pageRule
    ? NextResponse.redirect(new URL("/", req.url))
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
      { issuer: "out-2026" }
    );

    if (pageRule && payload.role !== "owner" && payload.area !== pageRule[1]) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (apiRule && !apiAllowed(payload, apiRule[2])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    const res = pageRule
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    res.cookies.delete("out_session");
    return res;
  }
}

export const config = {
  matcher: [
    "/panel-x9k7/:path*", "/panel-m3p8/:path*",
    "/api/designs/:path*", "/api/pod/:path*", "/api/orders/:path*",
    "/api/social/:path*", "/api/stats/:path*", "/api/products/:path*"
  ]
};
