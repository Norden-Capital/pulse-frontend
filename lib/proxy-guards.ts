/**
 * Checks the API proxy (app/api/[...path]/route.ts) makes before forwarding a
 * request to the backend. Plain functions with no Next.js or server imports,
 * so `npm test` runs them directly (lib/proxy-guards.test.ts).
 */

/** Methods that never change anything; everything else is a write. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/** Allowed in development only: the `next dev` server. */
export const DEV_ORIGIN = "http://localhost:3000"

/**
 * CSRF guard: is this write really from our own pages?
 *
 * The backend never sees the browser's `Origin` (the proxy drops it), so this
 * check lives here and is always on.
 *
 * - GET/HEAD/OPTIONS: allowed (they must not change anything).
 * - `Origin` present: must be one of this site's own origins.
 *   `Origin: null` (sandboxed frames, some redirects) is refused.
 * - `Sec-Fetch-Site` present: must be `same-origin`.
 * - Neither header: allowed. Browsers send at least one of them on every
 *   cross-origin write, so such a request is not a browser riding a user's
 *   cookie (it is curl, a script, a server), and CSRF needs a browser.
 */
export function isSameOriginWrite(method: string, headers: Headers, allowedOrigins: readonly string[]): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true

  const origin = headers.get("origin")
  if (origin !== null && !allowedOrigins.includes(origin)) return false

  const fetchSite = headers.get("sec-fetch-site")
  if (fetchSite !== null && fetchSite !== "same-origin") return false

  return true
}

/**
 * This site's own origin(s): the origin of the request URL and of the
 * Host / X-Forwarded-Host the platform passed (they agree on Vercel; behind
 * other proxies the URL can be internal), plus the dev server outside production.
 */
export function ownOrigins(requestUrl: string, headers: Headers, development: boolean): string[] {
  const url = new URL(requestUrl)
  const origins = new Set<string>([url.origin])
  const host = headers.get("x-forwarded-host") ?? headers.get("host")
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")
    origins.add(`${proto}://${host}`)
  }
  if (development) origins.add(DEV_ORIGIN)
  return [...origins]
}

/** An IPv4 or IPv6 address and nothing else. */
const ADDRESS = /^[0-9A-Fa-f:.]{2,45}$/

/**
 * The visitor's IP address for the backend's `X-Client-IP`, or null.
 *
 * Only on Vercel (`onVercel`), where the platform sets `x-real-ip` and
 * `x-forwarded-for` itself and overwrites whatever the client sent. Anywhere
 * else these headers may come straight from the caller, so nothing is sent.
 */
export function clientIp(headers: Headers, onVercel: boolean): string | null {
  if (!onVercel) return null
  const candidate = headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return candidate && ADDRESS.test(candidate) ? candidate : null
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9-]{1,64}$/

/** The caller's `X-Request-Id` if it is safe to pass on, else a new one. */
export function requestIdOf(headers: Headers): string {
  const incoming = headers.get("x-request-id")
  return incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : crypto.randomUUID()
}

/** Request headers never forwarded to the backend. */
const DROP_REQUEST = new Set([
  // Hop-by-hop: they describe this connection, not the request.
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  // fetch sets these itself for the new connection.
  "host",
  "content-length",
  // Let fetch negotiate a compression it can decode (see DROP_RESPONSE).
  "accept-encoding",
  // To the backend this is a server-to-server call proven by the secret, not
  // a CORS request. The same-origin check above already used it.
  "origin",
  // Set by the proxy only; a caller cannot bring their own.
  "x-pulse-proxy-secret",
  "x-request-id",
  // Addresses: ours is set from the platform's headers; anything the caller
  // sent could be forged.
  "x-client-ip",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "forwarded",
])

/** Prefixes of platform headers the backend has no use for (some carry tokens). */
const DROP_REQUEST_PREFIXES = ["x-vercel-", "x-middleware-", "x-invoke-", "x-nextjs-", "next-router-"]

/** The browser's headers minus everything the backend must not get. */
export function forwardableRequestHeaders(incoming: Headers): Headers {
  const out = new Headers()
  incoming.forEach((value, name) => {
    const key = name.toLowerCase()
    if (DROP_REQUEST.has(key) || DROP_REQUEST_PREFIXES.some((p) => key.startsWith(p))) return
    out.append(name, value)
  })
  return out
}

/** Response headers never returned to the browser. */
const DROP_RESPONSE = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  // fetch has already decompressed the body, so these would describe bytes
  // that are no longer there. The platform compresses and frames it again.
  "content-encoding",
  "content-length",
  // Re-added one cookie at a time below.
  "set-cookie",
])

/** The backend's headers minus hop-by-hop ones; API answers are never cached. */
export function returnableResponseHeaders(upstream: Headers): Headers {
  const out = new Headers()
  upstream.forEach((value, name) => {
    if (!DROP_RESPONSE.has(name.toLowerCase())) out.append(name, value)
  })
  // Several cookies must stay several headers: joining them breaks them.
  for (const cookie of upstream.getSetCookie()) out.append("set-cookie", cookie)
  if (!out.has("cache-control")) out.set("cache-control", "no-store")
  return out
}
