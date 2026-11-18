import "server-only"

// Server-only session helpers. Cookie presence (checked in proxy.ts) is not
// trusted: every private render asks the backend who the user is.
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { backendFetch } from "./backend"
import { SESSION_COOKIE_NAME, type CurrentUser } from "./auth-types"
import { signedOutTarget, WELCOME_SEEN_COOKIE } from "./onboarding/routing"

/** How long a server render waits for the backend before showing its error state. */
const SERVER_TIMEOUT_MS = 15_000

/** GET `/api${path}` on the backend from the server, with the browser's cookies and the proxy secret. */
export async function backendGet(path: string): Promise<Response> {
  const cookieHeader = (await cookies()).toString()
  return backendFetch(`/api${path}`, {
    headers: { cookie: cookieHeader, accept: "application/json" },
    signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
  })
}

/** The signed-in user, or null if there is no valid session. Throws if the backend can't answer. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // No session cookie: no need to ask the backend.
  if (!(await cookies()).has(SESSION_COOKIE_NAME)) return null
  const res = await backendGet("/auth/me")
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) throw new Error(`Session check failed (${res.status})`)
  const user = (await res.json()) as CurrentUser
  return { id: String(user.id), email: user.email }
})

/** The signed-in user; without one, redirect to /welcome or /login (coming back to `nextPath` after). */
export async function requireUser(nextPath = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(signedOutTarget(nextPath, (await cookies()).has(WELCOME_SEEN_COOKIE)))
  return user
}
