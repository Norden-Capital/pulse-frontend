import { headers } from "next/headers"
import { requireUser } from "@/lib/auth"
import { safeNextPath } from "@/lib/auth-types"

// Private pages must wait for the session check: nothing may render before we
// know who the user is. So this layout blocks on the server (no <Suspense>)
// and redirect() happens before anything renders.
export const instant = false

// Second guard (proxy.ts is the first): ask the backend (GET /api/auth/me)
// who the user is. No app shell yet (Phase 1): just a phone-width column.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser(safeNextPath((await headers()).get("x-pulse-path")))
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-(--sp-gutter) pt-6 pb-8">
      {children}
    </main>
  )
}
