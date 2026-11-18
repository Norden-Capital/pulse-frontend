// Shapes of the onboarding API (docs/api/onboarding-profile.md). No imports,
// so the server, the browser and the tests can all use them.

export type Goal = "LOSE" | "MAINTAIN" | "BUILD"
export type Sex = "MALE" | "FEMALE" | "UNSPECIFIED"
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "ACTIVE" | "VERY_ACTIVE"
export type WorkoutsPerWeek = "W0" | "W1_2" | "W3_4" | "W5_PLUS"
export type TrainingType = "GYM" | "HOME" | "CARDIO"
export type Units = "METRIC" | "IMPERIAL"

export const GOALS: readonly Goal[] = ["LOSE", "MAINTAIN", "BUILD"]
export const SEXES: readonly Sex[] = ["MALE", "FEMALE", "UNSPECIFIED"]
export const ACTIVITY_LEVELS: readonly ActivityLevel[] = ["SEDENTARY", "LIGHT", "ACTIVE", "VERY_ACTIVE"]
export const WORKOUTS: readonly WorkoutsPerWeek[] = ["W0", "W1_2", "W3_4", "W5_PLUS"]
export const TRAINING_TYPES: readonly TrainingType[] = ["GYM", "HOME", "CARDIO"]
export const UNITS: readonly Units[] = ["METRIC", "IMPERIAL"]

/** Body of POST /api/onboarding/plan and `profile.answers` at register. Always metric. */
export type ProfileAnswers = {
  goal: Goal
  sex: Sex
  ageYears: number
  heightCm: number
  weightKg: number
  goalWeightKg: number | null
  activityLevel: ActivityLevel
  workoutsPerWeek: WorkoutsPerWeek
  trainingTypes: TrainingType[]
  units: Units
}

/** Daily targets. Sent at register only as the manual override ("Adjust targets"). */
export type Targets = { calories: number; proteinG: number; carbsG: number; fatG: number }

/** Answer of POST /api/onboarding/plan (formula pulse-energy-v1). */
export type Plan = Targets & {
  formula: string
  source: "calculated"
  percent: { protein: number; carbs: number; fat: number }
  marginPercent: number
  steps: {
    bmr: { sex: Sex; weightKg: number; heightCm: number; ageYears: number; sexConstant: number; value: number }
    activity: { activityLevel: ActivityLevel; workoutsPerWeek: WorkoutsPerWeek; factor: number; value: number }
    goal: {
      goal: Goal
      adjustment: number
      beforeRounding: number
      floor: number
      floorApplied: boolean
      value: number
    }
    macros: { proteinGPerKg: number; proteinCapped: boolean; fatPercent: number; carbs: string }
  }
}

/** GET /api/me/profile. */
export type StoredProfile = {
  answers: ProfileAnswers
  measurementsSource: "manual" | "calculated" | "device"
  targets: Targets & { source: "calculated" | "manual" }
  calculated: Plan
  answeredAt: string
  updatedAt: string
}
