import "server-only"

import { unstable_rethrow } from "next/navigation"
import { backendGet } from "./auth"
import { tokenCheckFrom } from "./token-result"
import type { TokenCheck, TokenInfo } from "./auth-types"

/**
 * Check an email-link token on the server (GET /api/auth/token/{token}), so
 * the page shows the right state at once. `purpose`: the page's own kind of
 * link; a token for the other purpose counts as invalid.
 */
export async function checkToken(token: string, purpose: TokenInfo["purpose"]): Promise<TokenCheck> {
  // Raw tokens are 43 characters; the backend refuses anything over 100 without hashing.
  if (!token || token.length > 100) return { kind: "invalid" }
  try {
    const res = await backendGet(`/auth/token/${encodeURIComponent(token)}`)
    const body = res.ok ? ((await res.json()) as TokenInfo) : null
    return tokenCheckFrom(res.status, body, purpose)
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err)
    // Backend down: the page says "try again later". Never log the token.
    return { kind: "error" }
  }
}
