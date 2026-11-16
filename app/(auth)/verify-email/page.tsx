import type { Metadata } from "next"
import { checkToken } from "@/lib/token-check"
import { tokenParam } from "@/lib/token-result"
import { VerifyEmail } from "./verify-email"

export const metadata: Metadata = {
  title: "Confirm email",
  // The token is in the URL: never send it to other sites as a referrer.
  // (next.config.ts also sends the Referrer-Policy header for this path.)
  referrer: "no-referrer",
}

// Blocks on the server on purpose (the token check), so nothing flashes.
export const instant = false

// The link is only checked here (GET). Confirming is a POST from a button:
// mail scanners open links, and opening a link must never change anything.
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const token = tokenParam((await searchParams).token)
  return <VerifyEmail token={token} check={await checkToken(token, "VERIFY")} />
}
