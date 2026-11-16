"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BIG } from "@/components/auth/auth-ui"

// Shown when a page or layout throws, e.g. the session check can't reach the
// backend. Sits at the root so it also catches errors from the (app) and
// (auth) layouts. No details: they could contain internal addresses.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-8 text-center">
      <p className="text-sm font-semibold tracking-wide text-muted-foreground">Pulse</p>
      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We could not load this page. Check your connection and try again.
      </p>
      <Button className={`${BIG} mt-8`} onClick={() => reset()}>
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </main>
  )
}
