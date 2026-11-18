"use client"

// "Your plan" (mockup 11): the numbers come from POST /api/onboarding/plan.
// Nothing is calculated here; the sheet explains the backend's own steps.

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "cn"
import { firstOpenStep, toProfileAnswers, type Draft } from "@/lib/onboarding/answers"
import type { Plan, Targets } from "@/lib/onboarding/types"
import { macroPercents } from "@/lib/onboarding/targets"
import { shortWeight, weightUnit } from "@/lib/onboarding/units"
import { Notice } from "@/components/auth/auth-ui"
import { InfoIcon } from "./icons"
import { Footer, PILL_PRIMARY, PILL_SECONDARY, TopBar } from "./onboarding-ui"
import { AdjustSheet, HowSheet, PlanNumbers } from "./plan-parts"
import { GOAL_TEXT, WORKOUTS_TEXT } from "./question-step"
import { useDraft } from "./use-draft"
import { usePlan } from "./use-plan"

/**
 * Answers + plan for the plan and account screens. Sends the user back to the
 * first open question if the answers are not complete (e.g. a direct link).
 */
export function usePlanForDraft() {
  const router = useRouter()
  const { draft, ready, setTargets } = useDraft()
  const open = ready ? firstOpenStep(draft) : null
  useEffect(() => {
    if (open) router.replace(`/start/${open}`)
  }, [open, router])
  const answers = ready && !open ? toProfileAnswers(draft) : null
  const { plan, error, retry } = usePlan(answers)
  return { draft, answers, plan, error, retry, setTargets }
}

/** What the app will use: the manual override, or the calculated plan. */
export function shownTargets(draft: Draft, plan: Plan): { targets: Targets; manual: boolean; percent: Plan["percent"] } {
  return draft.targets
    ? { targets: draft.targets, manual: true, percent: macroPercents(draft.targets) }
    : { targets: plan, manual: false, percent: plan.percent }
}

/** "Build muscle · 78 → 82 kg · 3–4 workouts a week". */
function summary(draft: Draft): string {
  const unit = weightUnit(draft.units)
  const weight = draft.goalWeightOn
    ? `${shortWeight(draft.weightKg, draft.units)} → ${shortWeight(draft.goalWeightKg, draft.units)} ${unit}`
    : `${shortWeight(draft.weightKg, draft.units)} ${unit}`
  const parts = [draft.goal ? GOAL_TEXT[draft.goal].title : "", weight]
  if (draft.workoutsPerWeek) parts.push(WORKOUTS_TEXT[draft.workoutsPerWeek].phrase)
  return parts.filter(Boolean).join(" · ")
}

export function PlanScreen() {
  const { draft, answers, plan, error, retry, setTargets } = usePlanForDraft()
  const [sheet, setSheet] = useState<"how" | "adjust" | null>(null)
  const shown = plan ? shownTargets(draft, plan) : null

  return (
    <div className="flex flex-1 flex-col px-(--sp-gutter) pt-2">
      <TopBar back="/start/units" />
      <h1 className="mt-3.5 text-[26px] leading-[1.22] font-medium tracking-[-0.01em]">Your plan</h1>
      <p className="mt-2 text-[13px] leading-[1.45] text-(--sp-text-muted)">{answers ? summary(draft) : " "}</p>

      {error ? (
        <div className="mt-5 space-y-3">
          <Notice tone="danger">{error}</Notice>
          <button type="button" className={PILL_SECONDARY} onClick={retry}>
            Try again
          </button>
        </div>
      ) : plan && shown ? (
        <>
          <PlanNumbers
            targets={shown.targets}
            percent={shown.percent}
            manual={shown.manual}
            calculatedCalories={plan.calories}
            onReset={() => setTargets(null)}
          />
          <div className="mt-[18px] text-center">
            <button
              type="button"
              onClick={() => setSheet("how")}
              className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium underline decoration-[color-mix(in_oklab,var(--sp-text)_30%,transparent)] underline-offset-4"
            >
              <InfoIcon />
              How we calculated this
            </button>
          </div>
          <HowSheet plan={plan} open={sheet === "how"} onOpenChange={(open) => setSheet(open ? "how" : null)} />
          <AdjustSheet
            open={sheet === "adjust"}
            onOpenChange={(open) => setSheet(open ? "adjust" : null)}
            start={shown.targets}
            calculated={{ calories: plan.calories, proteinG: plan.proteinG, carbsG: plan.carbsG, fatG: plan.fatG }}
            onSave={setTargets}
          />
        </>
      ) : (
        <PlanSkeleton />
      )}

      <Footer>
        {plan ? (
          <Link href="/start/account" className={PILL_PRIMARY}>
            Continue
          </Link>
        ) : (
          <button type="button" className={PILL_PRIMARY} disabled>
            Continue
          </button>
        )}
        <button type="button" className={PILL_SECONDARY} disabled={!plan} onClick={() => setSheet("adjust")}>
          Adjust targets
        </button>
      </Footer>
    </div>
  )
}

function PlanSkeleton() {
  const block = "animate-pulse rounded-(--sp-radius) bg-(--sp-panel) motion-reduce:animate-none"
  return (
    <div aria-busy="true" aria-label="Calculating your plan">
      <div className={cn(block, "mt-5 h-[211px]")} />
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(block, "h-[94px] rounded-[18px]")} />
        ))}
      </div>
    </div>
  )
}
