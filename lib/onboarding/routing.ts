// Where a signed-out visitor goes. The welcome screen is for the first visit
// on a device: the browser remembers "seen" (localStorage + this cookie, so
// proxy.ts and the server can decide before anything renders). After that,
// a signed-out visitor goes to sign in. No imports: proxy, server and tests share it.

/** Set by the welcome screen. Not secret, not a session: only "this device has seen /welcome". */
export const WELCOME_SEEN_COOKIE = "pulse_welcome_seen"
export const WELCOME_SEEN_KEY = "pulse:welcome-seen"
/** One year. */
export const WELCOME_SEEN_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Target for a signed-out visitor who asked for the private page `wanted`
 * (path + query). The app's start page shows the welcome screen once per
 * device; a deep link (e.g. /settings/security) always goes to sign in and
 * comes back after.
 */
export function signedOutTarget(wanted: string, seenWelcome: boolean): string {
  if (wanted === "/") return seenWelcome ? "/login" : "/welcome"
  return `/login?next=${encodeURIComponent(wanted)}`
}

/** The cookie line the welcome screen writes. `secure` on HTTPS. */
export function welcomeSeenCookie(secure: boolean): string {
  return `${WELCOME_SEEN_COOKIE}=1; Path=/; Max-Age=${WELCOME_SEEN_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`
}
