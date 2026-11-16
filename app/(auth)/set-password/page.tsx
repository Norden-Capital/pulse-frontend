import type { Metadata } from "next"
import { checkToken } from "@/lib/token-check"
import { tokenParam } from "@/lib/token-result"
import { SetPasswordForm } from "./set-password-form"

export const metadata: Metadata = {
  title: "Choose a new password",
  // The token is in the URL: never send it to other sites as a referrer.
  // (next.config.ts also sends the Referrer-Policy header for this path.)
  referrer: "no-referrer",
}

// Blocks on the server on purpose (the token check), so nothing flashes.
export const instant = false

export default async function SetPasswordPage({ searchParams }: PageProps<"/set-password">) {
  const token = tokenParam((await searchParams).token)
  return <SetPasswordForm token={token} check={await checkToken(token, "RESET")} />
}
