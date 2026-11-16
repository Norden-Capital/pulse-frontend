import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { unstable_rethrow } from "next/navigation"
import { backendGet } from "@/lib/auth"
import type { Passkey } from "@/lib/auth-types"
import { ChangePasswordCard } from "@/components/settings/change-password-card"
import { PasskeysSection } from "@/components/settings/passkeys-section"
import { SignInHistory } from "@/components/settings/sign-in-history"

export const metadata: Metadata = { title: "Security" }

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false

/** The user's passkeys, or null if they could not be loaded. */
async function getPasskeys(): Promise<Passkey[] | null> {
  try {
    const res = await backendGet("/me/passkeys")
    return res.ok ? ((await res.json()) as Passkey[]) : null
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err)
    return null
  }
}

export default async function SecurityPage() {
  const passkeys = await getPasskeys()
  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/"
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Home
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Security</h1>
      </header>
      <ChangePasswordCard />
      <PasskeysSection passkeys={passkeys} />
      <SignInHistory />
    </div>
  )
}
