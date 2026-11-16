// Browser-side helper for calling the backend through the same-origin
// `/api/*` proxy (app/api/[...path]/route.ts). Cookies go along automatically.
//
// CSRF (docs/api/auth.md §2): every write sends the `XSRF-TOKEN` cookie value
// in `X-XSRF-TOKEN`. No cookie yet → GET /api/auth/csrf first. A
// `403 csrf_invalid` gets a fresh token and ONE retry (Spine lib/api.ts).
//
// All user-facing error texts live here (ERROR_MESSAGES), so screens just
// show `errorMessage(err)` and only special-case codes that change the flow.

import { isGuestPath } from "./auth-types"

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** The whole error body, for errors that carry data. */
    public data?: Record<string, unknown>
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/** Short, friendly text for every error code the backend or the proxy can send. */
export const ERROR_MESSAGES: Record<string, string> = {
  // Session and security
  unauthorized: "Your session has ended. Please sign in again.",
  forbidden: "You are not allowed to do this.",
  csrf_invalid: "Your session was out of date. Please reload the page and try again.",
  csrf_missing: "Could not start a secure session. Please reload the page.",
  csrf_rejected: "This request did not come from the Pulse website. Please reload the page.",
  invalid_credentials: "Email or password is wrong.",
  email_not_verified: "Please confirm your email first. Check your inbox for our link.",
  too_many_attempts: "Too many attempts. Please wait a few minutes and try again.",
  // Input
  validation_error: "Some information is not valid. Please check and try again.",
  bad_request: "Some information is not valid. Please check and try again.",
  weak_password: "This password is too weak. Use at least 12 characters.",
  invalid_current_password: "Your current password is wrong.",
  // Links
  token_invalid: "This link has expired or was already used.",
  // Passkeys
  passkey_invalid: "This Face ID / passkey did not work here. Sign in with your password.",
  passkey_not_found: "This passkey no longer exists.",
  // Server
  not_found: "We could not find this.",
  internal_error: "Something went wrong on our side. Please try again.",
  service_unavailable: "The Pulse server cannot be reached right now. Try again in a moment.",
  // Client side
  network_error: "Can't reach the server. Check your connection.",
  timeout: "The server did not answer in time. Please try again.",
}

const STATUS_MESSAGES: Record<number, string> = {
  401: ERROR_MESSAGES.unauthorized,
  403: ERROR_MESSAGES.forbidden,
  404: ERROR_MESSAGES.not_found,
  429: ERROR_MESSAGES.too_many_attempts,
  503: ERROR_MESSAGES.service_unavailable,
  504: ERROR_MESSAGES.timeout,
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

/** The text to show the user for any error thrown by `api()`. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : FALLBACK_MESSAGE
}

/** Build the ApiError for a failed response from its status and raw body text. */
export function errorFrom(status: number, body: string): ApiError {
  let code = "unknown_error"
  let data: Record<string, unknown> | undefined
  try {
    const parsed: unknown = JSON.parse(body)
    if (parsed && typeof parsed === "object") {
      data = parsed as Record<string, unknown>
      if (typeof data.error === "string") code = data.error
    }
  } catch {
    // Not JSON: keep the generic message.
  }
  const message = ERROR_MESSAGES[code] ?? STATUS_MESSAGES[status] ?? FALLBACK_MESSAGE
  return new ApiError(status, code, message, data)
}

/** The value of cookie `name` in a `document.cookie`-style string, or null. */
export function readCookie(cookieString: string, name: string): string | null {
  const part = cookieString.split("; ").find((p) => p.startsWith(`${name}=`))
  if (!part) return null
  try {
    return decodeURIComponent(part.slice(name.length + 1))
  } catch {
    return null
  }
}

/** Longest wait for one API answer before we show an error. */
const REQUEST_TIMEOUT_MS = 20_000

const CSRF_COOKIE = "XSRF-TOKEN"
const CSRF_HEADER = "X-XSRF-TOKEN"

async function refreshCsrfCookie(): Promise<void> {
  try {
    await fetch("/api/auth/csrf", { credentials: "same-origin", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  } catch {
    // The next request fails with network_error anyway.
  }
}

/** Read the token fresh every time: it changes at sign-in and sign-out. */
async function csrfToken(forceRefresh: boolean): Promise<string> {
  let token = forceRefresh ? null : readCookie(document.cookie, CSRF_COOKIE)
  if (!token) {
    await refreshCsrfCookie()
    token = readCookie(document.cookie, CSRF_COOKIE)
  }
  if (!token) throw new ApiError(0, "csrf_missing", ERROR_MESSAGES.csrf_missing)
  return token
}

/** The session is gone on a private page: go to sign-in and come back after. */
function goToLogin() {
  const { pathname, search } = window.location
  if (isGuestPath(pathname)) return
  const wanted = pathname + search
  const next = wanted === "/" ? "" : `?next=${encodeURIComponent(wanted)}`
  // Full page load on purpose: it drops every cached page of the old session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login${next}`)
}

export type ApiOptions = { method?: string; body?: unknown }

/** Call the backend at `/api${path}`; returns the JSON body (undefined for 204). Throws ApiError. */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase()
  const needsCsrf = method !== "GET" && method !== "HEAD"

  async function send(freshCsrf: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" }
    if (needsCsrf) headers[CSRF_HEADER] = await csrfToken(freshCsrf)
    if (options.body !== undefined) headers["Content-Type"] = "application/json"
    try {
      return await fetch(`/api${path}`, {
        method,
        headers,
        credentials: "same-origin",
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        // Never spin forever: no answer in 20 s is an error the screen shows.
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new ApiError(0, "timeout", ERROR_MESSAGES.timeout)
      }
      throw new ApiError(0, "network_error", ERROR_MESSAGES.network_error)
    }
  }

  let res = await send(false)
  let error = res.ok ? null : errorFrom(res.status, await res.text().catch(() => ""))

  // Old or missing CSRF token: get a new one and try ONE more time.
  if (error?.code === "csrf_invalid" && needsCsrf) {
    res = await send(true)
    error = res.ok ? null : errorFrom(res.status, await res.text().catch(() => ""))
  }

  if (error) {
    if (error.code === "unauthorized") goToLogin()
    throw error
  }

  if (res.status === 202 || res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
