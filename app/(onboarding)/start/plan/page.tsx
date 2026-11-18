import type { Metadata } from "next"
import { PlanScreen } from "@/components/onboarding/plan-screen"

export const metadata: Metadata = { title: "Your plan" }

export default function PlanPage() {
  return <PlanScreen />
}
