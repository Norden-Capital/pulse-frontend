// The onboarding answers while the user goes through the questions (the
// "draft"). Pure functions only; components/onboarding/use-draft.ts keeps the
// draft in sessionStorage so back and refresh work.

import {
  ACTIVITY_LEVELS,
  GOALS,
  SEXES,
  TRAINING_TYPES,
  UNITS,
  WORKOUTS,
  type ActivityLevel,
  type Goal,
  type ProfileAnswers,
  type Sex,
  type Targets,
  type TrainingType,
  type Units,
  type WorkoutsPerWeek,
} from "./types"
import { AGE_YEARS, HEIGHT_CM, WEIGHT_KG, round1 } from "./units"
import { isValidTargets } from "./targets"

/** The 8 question screens, in order. The slug is the URL: /start/<slug>. */
export const STEPS = ["goal", "sex", "age", "height", "weight", "activity", "training", "units"] as const
export type Step = (typeof STEPS)[number]

export function isStep(value: string): value is Step {
  return (STEPS as readonly string[]).includes(value)
}

export type Draft = {
  goal: Goal | null
  sex: Sex | null
  ageYears: number
  heightCm: number
  weightKg: number
  /** The optional goal weight is switched on. */
  goalWeightOn: boolean
  goalWeightKg: number
  activityLevel: ActivityLevel | null
  workoutsPerWeek: WorkoutsPerWeek | null
  trainingTypes: TrainingType[]
  units: Units
  /** Manual override from "Adjust targets", or null to use the calculated plan. */
  targets: Targets | null
}

/** Starting values: the pickers need a number to show, the choices start empty. */
export const EMPTY_DRAFT: Draft = {
  goal: null,
  sex: null,
  ageYears: 30,
  heightCm: 170,
  weightKg: 70,
  goalWeightOn: false,
  goalWeightKg: 70,
  activityLevel: null,
  workoutsPerWeek: null,
  trainingTypes: [],
  units: "METRIC",
  targets: null,
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : null
}

function numberIn(value: unknown, min: number, max: number, fallback: number, decimals: 0 | 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return fallback
  return decimals === 0 ? Math.round(value) : round1(value)
}

/**
 * Read a stored draft. Anything missing, unknown or out of range falls back to
 * the starting value, so an old or edited sessionStorage entry can't break the flow.
 */
export function parseDraft(raw: string | null): Draft {
  if (!raw) return EMPTY_DRAFT
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_DRAFT
    data = parsed as Record<string, unknown>
  } catch {
    return EMPTY_DRAFT
  }
  const training = Array.isArray(data.trainingTypes) ? data.trainingTypes : []
  const targets = data.targets as Targets | null | undefined
  return {
    goal: oneOf(GOALS, data.goal),
    sex: oneOf(SEXES, data.sex),
    ageYears: numberIn(data.ageYears, AGE_YEARS.min, AGE_YEARS.max, EMPTY_DRAFT.ageYears, 0),
    heightCm: numberIn(data.heightCm, HEIGHT_CM.min, HEIGHT_CM.max, EMPTY_DRAFT.heightCm, 1),
    weightKg: numberIn(data.weightKg, WEIGHT_KG.min, WEIGHT_KG.max, EMPTY_DRAFT.weightKg, 1),
    goalWeightOn: data.goalWeightOn === true,
    goalWeightKg: numberIn(data.goalWeightKg, WEIGHT_KG.min, WEIGHT_KG.max, EMPTY_DRAFT.goalWeightKg, 1),
    activityLevel: oneOf(ACTIVITY_LEVELS, data.activityLevel),
    workoutsPerWeek: oneOf(WORKOUTS, data.workoutsPerWeek),
    // Known values only, each once, in a fixed order.
    trainingTypes: TRAINING_TYPES.filter((type) => training.includes(type)),
    units: oneOf(UNITS, data.units) ?? EMPTY_DRAFT.units,
    targets: targets && typeof targets === "object" && isValidTargets(targets) ? targets : null,
  }
}

export type AnswerChange = Partial<Omit<Draft, "targets">>

/**
 * Apply answer changes. A manual override belongs to the answers it was made
 * for, so changing anything that feeds the formula drops it. Units are only a
 * display preference and keep it.
 */
export function applyAnswers(draft: Draft, change: AnswerChange): Draft {
  const next = { ...draft, ...change }
  const formulaChanged = (["goal", "sex", "ageYears", "heightCm", "weightKg", "activityLevel", "workoutsPerWeek"] as const).some(
    (key) => key in change && change[key] !== draft[key]
  )
  return formulaChanged ? { ...next, targets: null } : next
}

/** Can the user continue past this step? Pickers always have a value; choices must be made. */
export function isStepDone(step: Step, draft: Draft): boolean {
  switch (step) {
    case "goal":
      return draft.goal !== null
    case "sex":
      return draft.sex !== null
    case "activity":
      return draft.activityLevel !== null && draft.workoutsPerWeek !== null
    default:
      return true
  }
}

/** The first question still to answer, or null when the plan can be made. */
export function firstOpenStep(draft: Draft): Step | null {
  return STEPS.find((step) => !isStepDone(step, draft)) ?? null
}

/** The step after `step`, or null after the last one. */
export function nextStep(step: Step): Step | null {
  return STEPS[STEPS.indexOf(step) + 1] ?? null
}

/** The step before `step`, or null for the first one. */
export function previousStep(step: Step): Step | null {
  const index = STEPS.indexOf(step)
  return index > 0 ? STEPS[index - 1] : null
}

/** The canonical (metric) answers for the API, or null while a question is open. */
export function toProfileAnswers(draft: Draft): ProfileAnswers | null {
  const { goal, sex, activityLevel, workoutsPerWeek } = draft
  if (!goal || !sex || !activityLevel || !workoutsPerWeek) return null
  return {
    goal,
    sex,
    ageYears: draft.ageYears,
    heightCm: round1(draft.heightCm),
    weightKg: round1(draft.weightKg),
    goalWeightKg: draft.goalWeightOn ? round1(draft.goalWeightKg) : null,
    activityLevel,
    workoutsPerWeek,
    trainingTypes: [...draft.trainingTypes],
    units: draft.units,
  }
}
