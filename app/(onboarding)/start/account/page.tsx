import type { Metadata } from "next"
import { AccountScreen } from "@/components/onboarding/account-screen"

export const metadata: Metadata = { title: "Save your plan" }

export default function AccountPage() {
  return <AccountScreen />
}
