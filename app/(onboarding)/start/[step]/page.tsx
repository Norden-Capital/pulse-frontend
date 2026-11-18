import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { STEPS, isStep } from "@/lib/onboarding/answers"
import { QuestionStep } from "@/components/onboarding/question-step"

// One page per question (/start/goal … /start/units), so the browser's back
// button and refresh work. The answers themselves live in sessionStorage.
// Unknown steps get a 404 below.

export function generateStaticParams() {
  return STEPS.map((step) => ({ step }))
}

export async function generateMetadata({ params }: PageProps<"/start/[step]">): Promise<Metadata> {
  const { step } = await params
  return { title: isStep(step) ? `Step ${STEPS.indexOf(step) + 1} of ${STEPS.length}` : "Get started" }
}

export default async function StepPage({ params }: PageProps<"/start/[step]">) {
  const { step } = await params
  if (!isStep(step)) notFound()
  return <QuestionStep step={step} />
}
