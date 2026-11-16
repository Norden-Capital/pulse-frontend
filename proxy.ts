import { NextResponse, type NextRequest } from "next/server"
import { backendFetch } from "@/lib/backend"
import { isGuestPath, SESSION_COOKIE_NAME } from "@/lib/auth-types"

// First guard (Next 16 "proxy", formerly middleware), as in Spine:
// - guest-only pages (/login, /register, …): a signed-in user goes to "/".
// - private pages (everything else): signed out → /login, keeping the wanted path.
// The layouts check again ((app)/layout.tsx, (auth)/layout.tsx), and the
// backend is the final guard. The /api proxy is excluded by the matcher, so
// request bodies are never buffered here.

type Session = "valid" | "expired" | "unknown"

/** Ask the backend (GET /api/auth/me, with the proxy secret) if the session cookie is still good. */
async function session(request: NextRequest): Promise<Session> {
  try {
    const res = await backendFetch("/api/auth/me", {
      headers: { cookie: request.headers.get("cookie") ?? "", accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    })
    if (res.ok) return "valid"
    if (res.status === 401) return "expired"
  } catch {
    // Backend down or not configured: let the page decide.
  }
  return "unknown"
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasCookie = request.cookies.has(SESSION_COOKIE_NAME)

  if (isGuestPath(pathname)) {
    if (!hasCookie) return NextResponse.next()
    // The cookie alone is not enough: an expired one would loop
    // /login → / → /login. So ask the backend.
    const status = await session(request)
    if (status === "valid") return NextResponse.redirect(new URL("/", request.url))
    const response = NextResponse.next()
    // Drop the dead cookie so later requests skip this check.
    if (status === "expired") response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  const wanted = pathname + search
  const toLogin = () => {
    const url = new URL("/login", request.url)
    if (wanted !== "/") url.searchParams.set("next", wanted)
    return NextResponse.redirect(url)
  }

  if (!hasCookie) return toLogin()

  // Cookie there, but the session may be over: check now, so the redirect
  // happens before anything renders.
  if ((await session(request)) === "expired") {
    const response = toLogin()
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  // Pass the wanted path on, so the server layout can send the user back
  // here after sign-in if the session turns out to be over.
  const headers = new Headers(request.headers)
  headers.set("x-pulse-path", wanted)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  // Skip the backend proxy, Next internals and files with an extension, so
  // static files stay public without a session.
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\..*).*)"],
}
