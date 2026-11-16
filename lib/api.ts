// Browser-side helper for calling the backend through the same-origin
// `/api/*` proxy (app/api/[...path]/route.ts). Cookies go along automatically.
//
// All user-facing error texts live here (ERROR_MESSAGES), so screens just
// show `errorMessage(err)` and only special-case codes that change the flow.

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
const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "You are not allowed to do this.",
  csrf_rejected: "This request did not come from the Pulse website. Please reload the page.",
  service_unavailable: "The Pulse server cannot be reached right now. Try again in a moment.",
  // Client side
  network_error: "Can't reach the server. Check your connection.",
  timeout: "The server did not answer in time. Please try again.",
}

const STATUS_MESSAGES: Record<number, string> = {
  403: ERROR_MESSAGES.forbidden,
  404: "We could not find this.",
  429: "Too many attempts. Please wait a few minutes and try again.",
  503: ERROR_MESSAGES.service_unavailable,
  504: ERROR_MESSAGES.timeout,
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

/** The text to show the user for any error thrown by `api()`. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : FALLBACK_MESSAGE
}

/** Longest wait for one API answer before we show an error. */
const REQUEST_TIMEOUT_MS = 20_000

/** Build the ApiError for a failed response from its `{error, message}` body. */
async function errorFrom(res: Response): Promise<ApiError> {
  let code = "unknown_error"
  let data: Record<string, unknown> | undefined
  try {
    data = JSON.parse(await res.text())
    if (typeof data?.error === "string") code = data.error
  } catch {
    // Not JSON: keep the generic message.
  }
  const message = ERROR_MESSAGES[code] ?? STATUS_MESSAGES[res.status] ?? FALLBACK_MESSAGE
  return new ApiError(res.status, code, message, data)
}

export type ApiOptions = { method?: string; body?: unknown; signal?: AbortSignal }

/** Call the backend at `/api${path}`; returns the JSON body. Throws ApiError on failure. */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Never spin forever: no answer in 20 s is an error the screen shows.
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    })
  } catch (err) {
    if (options.signal?.aborted) throw err
    if (timeout.aborted) throw new ApiError(0, "timeout", ERROR_MESSAGES.timeout)
    throw new ApiError(0, "network_error", ERROR_MESSAGES.network_error)
  }

  if (!res.ok) throw await errorFrom(res)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
