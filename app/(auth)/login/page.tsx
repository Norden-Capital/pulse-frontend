import type { Metadata } from "next"
import { safeNextPath } from "@/lib/auth-types"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

// Blocks on the server on purpose (URL data), so nothing flashes.
export const instant = false

// A signed-in user is sent to "/" by proxy.ts and the (auth) layout. Search
// params are read here on the server, so the form renders at once.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, password, verified } = await searchParams
  const notice = password === "set" ? "password-set" : verified === "1" ? "verified" : null
  return <LoginForm next={safeNextPath(typeof next === "string" ? next : null)} notice={notice} />
}
