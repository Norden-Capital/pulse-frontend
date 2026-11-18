import { redirect, unstable_rethrow } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

// Welcome and onboarding (/welcome, /start/…): guest-only, like the sign-in
// pages, so a signed-in user goes to "/". Blocks on the server (no
// <Suspense>) so nothing renders before that check. The screens keep their
// own padding: the welcome collage runs edge to edge.
export const instant = false

export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser().catch((err: unknown) => {
    // Let Next.js internal signals through; a real error = show the page.
    unstable_rethrow(err)
    return null
  })
  if (user) redirect("/")

  return <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col">{children}</main>
}
