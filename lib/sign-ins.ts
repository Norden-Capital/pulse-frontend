// Pure helpers for the sign-in history (GET /api/me/sign-ins). Tested.
import type { SignInDay } from "./auth-types"

/** The browser's IANA time zone (e.g. "Europe/Paris"), or "UTC" if unknown. */
export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

/** The query string for GET /api/me/sign-ins: just the zone (the backend's default `from` is 6 months back). */
export function signInsQuery(zone: string): string {
  return `?zone=${encodeURIComponent(zone)}`
}

export type SignInSummary = {
  ok: number
  failed: number
  /** Days with attempts, newest first, at most `limit`. */
  recent: SignInDay[]
}

/** Totals over all days, and the most recent days for a short list. */
export function summarizeSignIns(days: SignInDay[], limit = 10): SignInSummary {
  let ok = 0
  let failed = 0
  for (const d of days) {
    ok += d.ok
    failed += d.failed
  }
  const recent = [...days].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, limit)
  return { ok, failed, recent }
}
