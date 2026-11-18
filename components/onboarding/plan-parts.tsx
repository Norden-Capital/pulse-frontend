"use client"

// Pieces of "Your plan" (mockups 11–12) shared with "Save your plan":
// the numbers, the "How we calculated this" sheet and "Adjust targets".

import { useState } from "react"
import { cn } from "cn"
import type { Plan, Targets } from "@/lib/onboarding/types"
import {
  MACRO_TOLERANCE,
  TARGET_LIMITS,
  isValidTargets,
  macroCalories,
  macroPercents,
  macrosForCalories,
  macrosMatch,
  sameTargets,
} from "@/lib/onboarding/targets"
import { ApproxIcon, InfoIcon, PencilIcon } from "./icons"
import { Badge, PILL_PRIMARY, PILL_SECONDARY, StepButton } from "./onboarding-ui"
import { ACTIVITY_TEXT, GOAL_TEXT, WORKOUTS_TEXT } from "./question-step"
import { Sheet, SheetClose } from "./sheet"

const num = new Intl.NumberFormat("en-US")
export const fmt = (n: number) => num.format(n)

/** Macro colours: the text colour at 100 / 45 / 18 %. */
export const MACRO_SHADES = {
  protein: "var(--sp-text)",
  carbs: "color-mix(in oklab, var(--sp-text) 45%, transparent)",
  fat: "color-mix(in oklab, var(--sp-text) 18%, transparent)",
} as const

/** "≈ Estimated" for the calculated plan, "Adjusted" for the user's own targets. */
export function SourceBadge({ manual, small }: { manual: boolean; small?: boolean }) {
  return manual ? (
    <Badge small={small} icon={<PencilIcon />}>
      Adjusted by you
    </Badge>
  ) : (
    <Badge small={small} icon={<ApproxIcon />}>
      Estimated
    </Badge>
  )
}

/** Calories card, the 3-part bar and the protein / carbs / fat tiles. */
export function PlanNumbers({
  targets,
  percent,
  manual,
  calculatedCalories,
  onReset,
}: {
  targets: Targets
  percent: { protein: number; carbs: number; fat: number }
  manual: boolean
  calculatedCalories: number
  onReset: () => void
}) {
  const macros = [
    { key: "protein", label: "Protein", grams: targets.proteinG, pct: percent.protein },
    { key: "carbs", label: "Carbs", grams: targets.carbsG, pct: percent.carbs },
    { key: "fat", label: "Fat", grams: targets.fatG, pct: percent.fat },
  ] as const
  return (
    <>
      <div className="mt-5 rounded-(--sp-radius) bg-(--sp-panel) p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-(--sp-text-muted)">Daily calories</span>
          <SourceBadge manual={manual} />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[56px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{fmt(targets.calories)}</span>
          <span className="text-[15px] font-medium text-(--sp-text-muted)">kcal / day</span>
        </div>
        <div className="mt-[18px] flex h-2.5 gap-1" aria-hidden>
          {macros.map((m) => (
            <i key={m.key} className="rounded-[5px]" style={{ flex: Math.max(m.pct, 1), background: MACRO_SHADES[m.key] }} />
          ))}
        </div>
        {manual ? (
          <p className="mt-3.5 text-xs leading-[1.45] text-(--sp-text-muted)">
            Your own targets. The calculated estimate was {fmt(calculatedCalories)} kcal.{" "}
            <button
              type="button"
              onClick={onReset}
              className="font-medium text-(--sp-text) underline decoration-[color-mix(in_oklab,var(--sp-text)_30%,transparent)] underline-offset-4"
            >
              Use the estimate
            </button>
          </p>
        ) : (
          <p className="mt-3.5 text-xs leading-[1.45] text-(--sp-text-muted)">
            Calculated from your answers with a standard formula. It is an estimate, not a measurement.
          </p>
        )}
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div key={m.key} className="rounded-[18px] bg-(--sp-panel) px-3.5 pt-3.5 pb-[13px]">
            <div className="flex items-center gap-1.5 text-xs text-(--sp-text-muted)">
              <i className="size-2 rounded-sm" style={{ background: MACRO_SHADES[m.key] }} />
              {m.label}
            </div>
            <b className="mt-1.5 block text-[22px] font-semibold tabular-nums">
              {m.grams}
              <span className="ml-0.5 text-[13px] font-medium text-(--sp-text-muted)">g</span>
            </b>
            <small className="text-[11px] text-(--sp-text-faint)">{m.pct}%</small>
          </div>
        ))}
      </div>
    </>
  )
}

/** "1.8" or "2" (no trailing ".0"). */
const plain = (n: number) => String(Number(n.toFixed(2)))
const signed = (n: number) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`)

/** Mockup 12: the four steps, written from the API's numbers. */
export function HowSheet({ plan, open, onOpenChange }: { plan: Plan; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { bmr, activity, goal, macros } = plan.steps
  const goalLine =
    goal.adjustment === 0
      ? "No change, rounded to 10 kcal"
      : `${signed(goal.adjustment)} kcal a day, rounded`
  const rows = [
    {
      title: "Energy at rest",
      text: (
        <>
          Mifflin–St Jeor formula:
          <br />
          10 × {plain(bmr.weightKg)} kg + 6.25 × {plain(bmr.heightCm)} cm − 5 × {bmr.ageYears} y {signed(bmr.sexConstant)}
          {bmr.sex === "UNSPECIFIED" && " (the average of both formulas)"}
        </>
      ),
      value: bmr.value,
    },
    {
      title: "Your daily activity",
      text: (
        <>
          × {plain(activity.factor)} for {ACTIVITY_TEXT[activity.activityLevel].lower} plus
          <br />
          {WORKOUTS_TEXT[activity.workoutsPerWeek].phrase}
        </>
      ),
      value: activity.value,
    },
    {
      title: `Your goal: ${GOAL_TEXT[goal.goal].lower}`,
      text: (
        <>
          {goalLine}
          {goal.floorApplied && (
            <>
              <br />
              Raised to the safe minimum of {fmt(goal.floor)} kcal
            </>
          )}
        </>
      ),
      value: goal.value,
    },
    {
      title: "Protein, carbs and fat",
      text: (
        <>
          Protein {plain(macros.proteinGPerKg)} g per kg of body weight, fat {macros.fatPercent}% of calories, carbs the rest
          {macros.proteinCapped && ". Protein is capped at 40% of calories"}
        </>
      ),
      value: null,
    },
  ]
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="How we calculated this" description="Four steps, from your answers.">
      <ol className="mt-[18px] flex flex-col">
        {rows.map((row, i) => (
          <li key={row.title} className={cn("flex gap-3 py-3", i > 0 && "border-t border-(--sp-divider)")}>
            <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-(--sp-input) text-xs font-semibold">
              {i + 1}
            </span>
            <span className="flex-1">
              <b className="block text-sm font-medium">{row.title}</b>
              <small className="mt-0.5 block text-xs leading-[1.45] text-(--sp-text-muted)">{row.text}</small>
            </span>
            {row.value !== null && <span className="text-sm font-semibold whitespace-nowrap tabular-nums">{fmt(row.value)}</span>}
          </li>
        ))}
      </ol>
      <Note>
        This is an estimate. Real needs can differ by {plan.marginPercent}% or more. Adjust your targets any time; nothing
        here is medical advice.
      </Note>
      <SheetClose className={cn(PILL_PRIMARY, "mt-[18px]")}>Got it</SheetClose>
    </Sheet>
  )
}

export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-1.5 flex gap-2.5 rounded-2xl bg-(--sp-input) px-3.5 py-3 text-xs leading-normal text-(--sp-text-2)", className)}>
      <span className="mt-px shrink-0">
        <InfoIcon />
      </span>
      <span>{children}</span>
    </div>
  )
}

/** Number field with − / + for the adjust sheet. Keeps typed text until it is a number. */
function TargetField({
  id,
  label,
  unit,
  value,
  step,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  unit: string
  value: number
  step: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState<string | null>(null)
  const clampTo = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] bg-(--sp-panel) py-2 pr-2 pl-4">
      <label htmlFor={id} className="flex-1 text-[13px] text-(--sp-text-muted)">
        {label}
      </label>
      <StepButton small kind="minus" label={`Less ${label.toLowerCase()}`} onStep={() => onChange(clampTo(value - step))} disabled={value <= min} />
      <span className="flex min-w-[92px] items-baseline justify-center gap-1">
        <input
          id={id}
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          value={text ?? String(value)}
          onFocus={(e) => {
            setText(String(value))
            e.currentTarget.select()
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 4)
            setText(raw)
            // Apply while typing only once the number is in range ("2" on the
            // way to "2500" must not count), and clamp when leaving the field.
            const n = Number(raw)
            if (raw && n >= min && n <= max) onChange(n)
          }}
          onBlur={() => {
            if (text && clampTo(Number(text)) !== value) onChange(clampTo(Number(text)))
            setText(null)
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-[3.2em] bg-transparent p-0 text-right text-xl! font-semibold tabular-nums outline-none focus:underline focus:decoration-(--sp-text-faint) focus:underline-offset-4"
        />
        <span className="w-8 text-[13px] font-medium text-(--sp-text-muted)">{unit}</span>
      </span>
      <StepButton small kind="plus" label={`More ${label.toLowerCase()}`} onStep={() => onChange(clampTo(value + step))} disabled={value >= max} />
    </div>
  )
}

/**
 * "Adjust targets": the user's own numbers, saved as `manual`. Changing the
 * calories recalculates the macros; the macros must stay within ±5 % of the
 * calories (the server checks the same rule).
 */
export function AdjustSheet({
  open,
  onOpenChange,
  start,
  calculated,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is shown now: the override, or the plan. */
  start: Targets
  calculated: Targets
  onSave: (targets: Targets | null) => void
}) {
  const [draft, setDraft] = useState(start)
  // Start from the shown numbers every time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(start)
  }

  const total = macroCalories(draft)
  const match = macrosMatch(draft)
  const valid = isValidTargets(draft)
  const isCalculated = sameTargets(draft, calculated)
  const pct = macroPercents(draft)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adjust targets"
      description="Set your own daily targets. They are saved as yours, not as an estimate."
    >
      <div className="mt-[18px] flex flex-col gap-2">
        <TargetField
          id="t-calories"
          label="Calories"
          unit="kcal"
          value={draft.calories}
          step={50}
          min={TARGET_LIMITS.calories.min}
          max={TARGET_LIMITS.calories.max}
          onChange={(calories) => setDraft(macrosForCalories(draft, calories))}
        />
        <TargetField
          id="t-protein"
          label={`Protein · ${pct.protein}%`}
          unit="g"
          value={draft.proteinG}
          step={5}
          min={TARGET_LIMITS.proteinG.min}
          max={TARGET_LIMITS.proteinG.max}
          onChange={(proteinG) => setDraft({ ...draft, proteinG })}
        />
        <TargetField
          id="t-carbs"
          label={`Carbs · ${pct.carbs}%`}
          unit="g"
          value={draft.carbsG}
          step={5}
          min={TARGET_LIMITS.carbsG.min}
          max={TARGET_LIMITS.carbsG.max}
          onChange={(carbsG) => setDraft({ ...draft, carbsG })}
        />
        <TargetField
          id="t-fat"
          label={`Fat · ${pct.fat}%`}
          unit="g"
          value={draft.fatG}
          step={5}
          min={TARGET_LIMITS.fatG.min}
          max={TARGET_LIMITS.fatG.max}
          onChange={(fatG) => setDraft({ ...draft, fatG })}
        />
      </div>
      <p
        role={match ? undefined : "alert"}
        className={cn("mt-3 px-1 text-xs leading-[1.45]", match ? "text-(--sp-text-muted)" : "text-(--sp-danger)")}
      >
        Protein, carbs and fat add up to {fmt(total)} kcal.
        {match
          ? " Changing the calories updates them for you."
          : ` That is more than ${MACRO_TOLERANCE * 100}% away from ${fmt(draft.calories)} kcal. Change the grams, or the calories to recalculate them.`}
      </p>
      <button
        type="button"
        className={cn(PILL_PRIMARY, "mt-[18px]")}
        disabled={!valid}
        onClick={() => {
          onSave(isCalculated ? null : draft)
          onOpenChange(false)
        }}
      >
        Save targets
      </button>
      {!isCalculated && (
        <button type="button" className={cn(PILL_SECONDARY, "mt-3")} onClick={() => setDraft(calculated)}>
          Back to the estimate
        </button>
      )}
    </Sheet>
  )
}
