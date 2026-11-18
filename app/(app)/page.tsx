import type { Metadata } from "next"
import { ChevronRight, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { PulseLogo } from "@/components/brand/pulse-logo"

export const metadata: Metadata = { title: "Home" }

export const instant = false

// Placeholder home until Phase 1 brings the real dashboard and app shell.
export default async function HomePage() {
  // Cached per request: the layout already asked the backend.
  const user = await requireUser()
  return (
    <div className="space-y-6">
      <header>
        <PulseLogo />
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">You are signed in</h1>
        <p className="mt-1 text-sm break-all text-muted-foreground">{user.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>Workouts, body, nutrition and progress arrive in the next phases.</CardDescription>
        </CardHeader>
      </Card>

      <Link
        href="/settings/security"
        className="flex min-h-14 items-center gap-3 rounded-(--sp-radius) bg-card px-4 transition-colors hover:bg-accent"
      >
        <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex-1">
          <span className="block text-sm font-medium">Security</span>
          <span className="block text-xs text-muted-foreground">Password, Face ID, sign-in history</span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>

      <SignOutButton />
    </div>
  )
}
