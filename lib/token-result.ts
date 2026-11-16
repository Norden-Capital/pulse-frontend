// Pure part of the email-link token check (tested): turn the backend's answer
// into the page state.
import type { TokenCheck, TokenInfo } from "./auth-types"

export function tokenCheckFrom(status: number, body: TokenInfo | null, purpose: TokenInfo["purpose"]): TokenCheck {
  if (status >= 200 && status < 300 && body) {
    return body.purpose === purpose ? { kind: "ready", info: body } : { kind: "invalid" }
  }
  // 410 token_invalid is the documented answer; 400/404 also mean "this link is no good".
  if (status === 410 || status === 404 || status === 400) return { kind: "invalid" }
  return { kind: "error" }
}

/** The `token` search param as a string ("" when missing or repeated). */
export function tokenParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : ""
}
