import { redirect, unstable_rethrow } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

// Guest-only pages (sign in, register, email links): only for people NOT
// signed in. The check blocks on the server (no <Suspense>), so a signed-in
// user is sent to "/" before the page can render.
export const instant = false

// Second guard (proxy.ts is the first). It asks the backend (GET
// /api/auth/me), so an expired cookie (401) still shows the page and never
// loops. If the backend is down, the page shows too.
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser().catch((err: unknown) => {
    // Let Next.js internal signals through; a real error = show the page.
    unstable_rethrow(err)
    return null
  })
  if (user) redirect("/")

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-4 pt-12 pb-8 [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
      {children}
    </main>
  )
}
