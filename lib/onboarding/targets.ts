// "Adjust targets": the user's own daily targets (stored as source `manual`).
// The plan itself always comes from the backend; this only keeps a manual
// override consistent. Server rules (contract §2 + hub decision Q4): whole
// numbers in range, and 4·P + 4·C + 9·F within ±5 % of the calories.

import type { Targets } from "./types"

export const TARGET_LIMITS = {
  calories: { min: 800, max: 6000 },
  proteinG: { min: 0, max: 500 },
  carbsG: { min: 0, max: 1000 },
  fatG: { min: 0, max: 400 },
} as const satisfies Record<keyof Targets, { min: number; max: number }>

/** Allowed gap between the macros' energy and the calories (hub decision Q4). */
export const MACRO_TOLERANCE = 0.05

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/** Energy of the macros: 4 kcal per g protein and carbs, 9 per g fat. */
export function macroCalories(t: Targets): number {
  return KCAL_PER_G.protein * t.proteinG + KCAL_PER_G.carbs * t.carbsG + KCAL_PER_G.fat * t.fatG
}

/** Do the macros add up to the calories within ±5 %? */
export function macrosMatch(t: Targets): boolean {
  return Math.abs(macroCalories(t) - t.calories) <= MACRO_TOLERANCE * t.calories
}

/** Is every field a whole number inside its range? */
export function inRange(t: Targets): boolean {
  return (Object.keys(TARGET_LIMITS) as (keyof Targets)[]).every((key) => {
    const value = t[key]
    const { min, max } = TARGET_LIMITS[key]
    return Number.isInteger(value) && value >= min && value <= max
  })
}

/** Would the server accept these targets as an override? */
export function isValidTargets(t: Targets): boolean {
  return typeof t === "object" && t !== null && inRange(t) && macrosMatch(t)
}

/**
 * New calories, macros to match: protein keeps its grams (it is set per kg of
 * body weight), fat keeps its share of the energy, carbs take the rest. If the
 * calories get too low for that protein, protein shrinks so the total still fits.
 */
export function macrosForCalories(current: Targets, calories: number): Targets {
  const kcal = Math.round(Math.min(TARGET_LIMITS.calories.max, Math.max(TARGET_LIMITS.calories.min, calories)))
  // Fat share in whole percent (the plan uses 25 %), and its energy unrounded,
  // as the formula does (contract §4 step 4), so the plan's own calories give
  // back the plan's own macros.
  const fatShare = current.calories > 0 ? Math.round((100 * KCAL_PER_G.fat * current.fatG) / current.calories) / 100 : 0.25
  const fatKcal = Math.min(KCAL_PER_G.fat * TARGET_LIMITS.fatG.max, fatShare * kcal)
  const fatG = Math.round(fatKcal / KCAL_PER_G.fat)
  const room = kcal - fatKcal
  const proteinG = Math.max(0, Math.min(current.proteinG, TARGET_LIMITS.proteinG.max, Math.floor(room / KCAL_PER_G.protein)))
  const carbsG = Math.max(
    0,
    Math.min(TARGET_LIMITS.carbsG.max, Math.round((room - KCAL_PER_G.protein * proteinG) / KCAL_PER_G.carbs))
  )
  return { calories: kcal, proteinG, carbsG, fatG }
}

/** Share of the energy per macro, for the bar and the "21 %" labels. Adds up to 100. */
export function macroPercents(t: Targets): { protein: number; carbs: number; fat: number } {
  const total = macroCalories(t)
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  const protein = Math.round((100 * KCAL_PER_G.protein * t.proteinG) / total)
  const fat = Math.round((100 * KCAL_PER_G.fat * t.fatG) / total)
  return { protein, carbs: Math.max(0, 100 - protein - fat), fat }
}

export function sameTargets(a: Targets, b: Targets): boolean {
  return a.calories === b.calories && a.proteinG === b.proteinG && a.carbsG === b.carbsG && a.fatG === b.fatG
}
