import { backendConfig, withProxySecret } from "@/lib/backend"
import {
  clientIp,
  forwardableRequestHeaders,
  isSameOriginWrite,
  ownOrigins,
  requestIdOf,
  returnableResponseHeaders,
} from "@/lib/proxy-guards"

/**
 * Same-origin proxy: the browser calls `/api/...` on this site, and this
 * handler forwards it to the backend from the server, adding the proxy secret
 * the backend requires. The backend address and the secret never reach the
 * browser.
 *
 * Why a Route Handler and not `next.config.ts` rewrites or `proxy.ts`:
 * - rewrites cannot add request headers, so the secret could not be sent.
 * - `proxy.ts` can, but buffers request bodies (cut at 10 MB) and runs on
 *   every route.
 * - Here both bodies are streamed, and every header in and out is decided in
 *   one readable place (lib/proxy-guards.ts).
 *
 * Before forwarding:
 * - a write (POST/PUT/PATCH/DELETE) from another site is refused here with
 *   403 `csrf_rejected` and never reaches the backend (always on);
 * - the visitor's IP goes along as `X-Client-IP`, on Vercel only;
 * - `X-Request-Id` is passed on if safe, else created, and returned.
 *
 * Passed through: method, path, query string, body, status, `Set-Cookie`
 * (each separately), redirects (not followed). Vercel caps a function's
 * request body at 4.5 MB.
 */

/** Longest wait for the backend before answering 504. */
const UPSTREAM_TIMEOUT_MS = 30_000

/** An error in the backend's own shape (`common.ApiError`). */
function apiError(status: number, error: string, message: string, requestId: string): Response {
  return Response.json(
    { error, message },
    { status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } }
  )
}

async function forward(request: Request): Promise<Response> {
  // The raw path and query, exactly as the browser sent them (still encoded).
  const { pathname, search } = new URL(request.url)
  const requestId = requestIdOf(request.headers)

  const origins = ownOrigins(request.url, request.headers, process.env.NODE_ENV !== "production")
  if (!isSameOriginWrite(request.method, request.headers, origins)) {
    console.warn(`[api proxy] ${request.method} ${pathname} refused: not same-origin`)
    return apiError(403, "csrf_rejected", "This request did not come from the Pulse website.", requestId)
  }

  const config = backendConfig()
  if (!config) {
    return apiError(503, "service_unavailable", "The Pulse server cannot be reached right now. Try again in a moment.", requestId)
  }

  const headers = withProxySecret(forwardableRequestHeaders(request.headers), config)
  headers.set("X-Request-Id", requestId)
  const ip = clientIp(request.headers, process.env.VERCEL === "1")
  if (ip) headers.set("X-Client-IP", ip)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // Required by fetch to send a streamed body.
    duplex: hasBody ? "half" : undefined,
    redirect: "manual",
    cache: "no-store",
    // The browser went away, or the backend is too slow: stop the call.
    signal: AbortSignal.any([request.signal, timeout]),
  }

  let upstream: Response
  try {
    upstream = await fetch(`${config.url}${pathname}${search}`, init)
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 })
    // The error's name only: messages can contain the URL.
    const name = (error as Error)?.name ?? "error"
    console.error(`[api proxy] ${request.method} ${pathname} failed: ${name}`)
    if (timeout.aborted) {
      return apiError(504, "timeout", "The Pulse server did not answer in time. Please try again.", requestId)
    }
    return apiError(503, "service_unavailable", "The Pulse server cannot be reached right now. Try again in a moment.", requestId)
  }

  const responseHeaders = returnableResponseHeaders(upstream.headers)
  if (!responseHeaders.has("x-request-id")) responseHeaders.set("X-Request-Id", requestId)
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export {
  forward as GET,
  forward as HEAD,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
}
