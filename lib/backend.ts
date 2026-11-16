import "server-only"

/**
 * The one way this app talks to the backend API, from the server only.
 *
 * The backend answers `/api/**` only when `X-Pulse-Proxy-Secret` carries the
 * value of `PULSE_PROXY_SECRET` (a Vercel variable here, `APP_PROXY_SECRET`
 * on the backend). `import "server-only"` makes the build fail if a client
 * component ever imports this file, so neither the address nor the secret can
 * reach the browser. Never give them a `NEXT_PUBLIC_` name.
 */

export const PROXY_SECRET_HEADER = "X-Pulse-Proxy-Secret"

/** `secret` is null only in development, where the local backend's check is off. */
export type BackendConfig = { url: string; secret: string | null }

/**
 * `BACKEND_URL` and `PULSE_PROXY_SECRET`, or null when a required one is
 * missing (the caller answers "service unavailable"). The secret is required
 * in production only, matching the backend ("empty = off" for local dev).
 * Trimmed: a pasted value with a trailing newline must still match.
 */
export function backendConfig(): BackendConfig | null {
  const url = process.env.BACKEND_URL?.trim().replace(/\/+$/, "")
  const secret = process.env.PULSE_PROXY_SECRET?.trim() || null
  const secretRequired = process.env.NODE_ENV === "production"
  if (!url || (secretRequired && !secret)) {
    // Names the missing variable, never a value.
    console.error(
      `[backend] ${!url ? "BACKEND_URL" : "PULSE_PROXY_SECRET"} is not set — calls to the backend will fail. See .env.example.`
    )
    return null
  }
  return { url, secret }
}

/** `headers` with the proxy secret added (when there is one). */
export function withProxySecret(headers: Headers, config: BackendConfig): Headers {
  if (config.secret) headers.set(PROXY_SECRET_HEADER, config.secret)
  return headers
}

/**
 * `fetch` against the backend from Server Components: `path` starts with
 * `/api/...`. Adds the proxy secret; everything else in `init` is passed
 * through. Throws if the configuration is missing, like a network error would.
 */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const config = backendConfig()
  if (!config) throw new Error("Backend is not configured")
  const headers = withProxySecret(new Headers(init.headers), config)
  return fetch(`${config.url}${path}`, { cache: "no-store", ...init, headers })
}
