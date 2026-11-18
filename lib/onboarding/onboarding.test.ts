import { describe, expect, it } from "vitest"

import {
  EMPTY_DRAFT,
  STEPS,
  applyAnswers,
  firstOpenStep,
  isStepDone,
  nextStep,
  parseDraft,
  previousStep,
  toProfileAnswers,
  type Draft,
} from "./answers"
import { signedOutTarget, welcomeSeenCookie } from "./routing"
import { isValidTargets, macroCalories, macroPercents, macrosForCalories, macrosMatch } from "./targets"
import {
  formatHeight,
  goalWeightScale,
  heightScale,
  inchesToCm,
  kgToLb,
  lbToKg,
  weightNumber,
  weightScale,
} from "./units"

/** The mockup's answers: male, 30 y, 180 cm, 78 kg, sitting, 3–4 workouts, build muscle. */
const MOCKUP: Draft = {
  ...EMPTY_DRAFT,
  goal: "BUILD",
  sex: "MALE",
  ageYears: 30,
  heightCm: 180,
  weightKg: 78,
  goalWeightOn: true,
  goalWeightKg: 82,
  activityLevel: "SEDENTARY",
  workoutsPerWeek: "W3_4",
  trainingTypes: ["GYM", "CARDIO"],
}

/** The mockup plan's numbers. */
const PLAN = { calories: 2980, proteinG: 156, carbsG: 403, fatG: 83 }

describe("unit conversion", () => {
  it("converts imperial input to metric with one decimal (contract §1)", () => {
    expect(inchesToCm(71)).toBe(180.3)
    expect(inchesToCm(70)).toBe(177.8)
    expect(lbToKg(172)).toBe(78)
    expect(lbToKg(180)).toBe(81.6)
    expect(lbToKg(155)).toBe(70.3)
  })

  it("never lets a whole inch or pound drift on the way through metric", () => {
    const height = heightScale("IMPERIAL")
    for (let tick = height.min; tick <= height.max; tick++) {
      expect(height.toTick(height.toMetric(tick)), `${tick} in`).toBe(tick)
    }
    const weight = weightScale("IMPERIAL")
    for (let tick = weight.min; tick <= weight.max; tick++) {
      expect(weight.toTick(weight.toMetric(tick)), `${tick} lb`).toBe(tick)
    }
  })

  it("keeps every picker value inside the API limits", () => {
    for (const units of ["METRIC", "IMPERIAL"] as const) {
      for (const scale of [heightScale(units), weightScale(units), goalWeightScale(units)]) {
        expect(scale.min).toBeLessThanOrEqual(scale.max)
      }
      const h = heightScale(units)
      expect(h.toMetric(h.min)).toBeGreaterThanOrEqual(120)
      expect(h.toMetric(h.max)).toBeLessThanOrEqual(230)
      for (const w of [weightScale(units), goalWeightScale(units)]) {
        expect(w.toMetric(w.min)).toBeGreaterThanOrEqual(30)
        expect(w.toMetric(w.max)).toBeLessThanOrEqual(300)
      }
    }
    // The tightest imperial edges.
    expect(heightScale("IMPERIAL").min).toBe(48)
    expect(heightScale("IMPERIAL").max).toBe(90)
    expect(weightScale("IMPERIAL").min).toBe(67)
    expect(weightScale("IMPERIAL").max).toBe(661)
  })

  it("metric weight moves in 0.1 kg and goal weight in 0.5 kg", () => {
    const w = weightScale("METRIC")
    expect(w.toTick(78)).toBe(780)
    expect(w.toMetric(781)).toBe(78.1)
    const g = goalWeightScale("METRIC")
    expect(g.toMetric(g.toTick(82.3))).toBe(82.5)
  })

  it("formats for display", () => {
    expect(formatHeight(180, "METRIC")).toBe("180 cm")
    expect(formatHeight(180.3, "IMPERIAL")).toBe("5 ft 11 in")
    expect(weightNumber(78, "METRIC")).toBe("78.0")
    expect(weightNumber(78, "IMPERIAL")).toBe("172")
    expect(kgToLb(lbToKg(200))).toBe(200)
    expect(heightScale("IMPERIAL").label(72)).toBe("6′")
    expect(heightScale("IMPERIAL").label(71)).toBe("5′11″")
  })
})

describe("answer state", () => {
  it("starts empty and asks the first question", () => {
    expect(parseDraft(null)).toEqual(EMPTY_DRAFT)
    expect(firstOpenStep(EMPTY_DRAFT)).toBe("goal")
    expect(toProfileAnswers(EMPTY_DRAFT)).toBeNull()
  })

  it("survives a round trip through storage", () => {
    expect(parseDraft(JSON.stringify(MOCKUP))).toEqual(MOCKUP)
  })

  it("falls back for broken or tampered storage", () => {
    expect(parseDraft("not json")).toEqual(EMPTY_DRAFT)
    expect(parseDraft("[1,2]")).toEqual(EMPTY_DRAFT)
    const draft = parseDraft(
      JSON.stringify({
        goal: "FLY",
        sex: "MALE",
        ageYears: 12,
        heightCm: 500,
        weightKg: "78",
        trainingTypes: ["CARDIO", "GYM", "GYM", "YOGA"],
        units: "FURLONGS",
        targets: { calories: 2980, proteinG: 0, carbsG: 0, fatG: 0 },
      })
    )
    expect(draft.goal).toBeNull()
    expect(draft.sex).toBe("MALE")
    expect(draft.ageYears).toBe(EMPTY_DRAFT.ageYears)
    expect(draft.heightCm).toBe(EMPTY_DRAFT.heightCm)
    expect(draft.weightKg).toBe(EMPTY_DRAFT.weightKg)
    expect(draft.trainingTypes).toEqual(["GYM", "CARDIO"])
    expect(draft.units).toBe("METRIC")
    // Macros far from the calories: not an override the server would take.
    expect(draft.targets).toBeNull()
  })

  it("only lets the user continue once a choice is made", () => {
    expect(isStepDone("goal", EMPTY_DRAFT)).toBe(false)
    expect(isStepDone("age", EMPTY_DRAFT)).toBe(true)
    expect(isStepDone("training", EMPTY_DRAFT)).toBe(true)
    expect(isStepDone("activity", { ...EMPTY_DRAFT, activityLevel: "LIGHT" })).toBe(false)
    expect(isStepDone("activity", { ...EMPTY_DRAFT, activityLevel: "LIGHT", workoutsPerWeek: "W0" })).toBe(true)
    expect(firstOpenStep({ ...EMPTY_DRAFT, goal: "LOSE", sex: "FEMALE" })).toBe("activity")
    expect(firstOpenStep(MOCKUP)).toBeNull()
  })

  it("walks the 8 steps in the mockup order", () => {
    expect(STEPS).toEqual(["goal", "sex", "age", "height", "weight", "activity", "training", "units"])
    expect(previousStep("goal")).toBeNull()
    expect(nextStep("goal")).toBe("sex")
    expect(previousStep("units")).toBe("training")
    expect(nextStep("units")).toBeNull()
  })

  it("builds the canonical metric answers for the API", () => {
    expect(toProfileAnswers(MOCKUP)).toEqual({
      goal: "BUILD",
      sex: "MALE",
      ageYears: 30,
      heightCm: 180,
      weightKg: 78,
      goalWeightKg: 82,
      activityLevel: "SEDENTARY",
      workoutsPerWeek: "W3_4",
      trainingTypes: ["GYM", "CARDIO"],
      units: "METRIC",
    })
    expect(toProfileAnswers({ ...MOCKUP, goalWeightOn: false })?.goalWeightKg).toBeNull()
    // Imperial is a display preference: the numbers stay metric.
    const imperial = toProfileAnswers({ ...MOCKUP, units: "IMPERIAL", heightCm: inchesToCm(71), weightKg: lbToKg(172) })
    expect(imperial).toMatchObject({ units: "IMPERIAL", heightCm: 180.3, weightKg: 78 })
  })

  it("drops a manual override when a formula answer changes, not for units", () => {
    const adjusted = { ...MOCKUP, targets: { calories: 2800, proteinG: 160, carbsG: 360, fatG: 85 } }
    expect(applyAnswers(adjusted, { units: "IMPERIAL" }).targets).not.toBeNull()
    expect(applyAnswers(adjusted, { trainingTypes: ["HOME"] }).targets).not.toBeNull()
    expect(applyAnswers(adjusted, { weightKg: 78 }).targets).not.toBeNull()
    expect(applyAnswers(adjusted, { weightKg: 79 }).targets).toBeNull()
    expect(applyAnswers(adjusted, { goal: "LOSE" }).targets).toBeNull()
  })
})

describe("adjust targets", () => {
  it("accepts the plan's own numbers", () => {
    expect(macroCalories(PLAN)).toBe(2983)
    expect(macrosMatch(PLAN)).toBe(true)
    expect(isValidTargets(PLAN)).toBe(true)
  })

  it("applies the ±5 % rule and the ranges", () => {
    // 2980 × 1.05 = 3129: 400 g carbs more is far over.
    expect(isValidTargets({ ...PLAN, carbsG: 800 })).toBe(false)
    expect(isValidTargets({ ...PLAN, calories: 799 })).toBe(false)
    expect(isValidTargets({ ...PLAN, proteinG: 156.5 })).toBe(false)
    // Within 5 %: 2983 vs 3100 kcal is 3.8 % off.
    expect(isValidTargets({ ...PLAN, calories: 3100 })).toBe(true)
    expect(isValidTargets({ ...PLAN, calories: 3150 })).toBe(false) // 5.3 %
  })

  it("recalculates the macros when the calories change, always within ±5 %", () => {
    expect(macrosForCalories(PLAN, 2980)).toEqual({ calories: 2980, proteinG: 156, carbsG: 403, fatG: 83 })
    const lower = macrosForCalories(PLAN, 2500)
    expect(lower.proteinG).toBe(156)
    expect(lower.fatG).toBe(69)
    for (let kcal = 800; kcal <= 6000; kcal += 10) {
      const t = macrosForCalories(PLAN, kcal)
      expect(isValidTargets(t), `${kcal} kcal → ${JSON.stringify(t)}`).toBe(true)
    }
  })

  it("splits the energy into percentages that add up to 100", () => {
    expect(macroPercents(PLAN)).toEqual({ protein: 21, carbs: 54, fat: 25 })
    const p = macroPercents({ calories: 2000, proteinG: 150, carbsG: 200, fatG: 67 })
    expect(p.protein + p.carbs + p.fat).toBe(100)
  })
})

describe("signed-out routing", () => {
  it("shows the welcome screen once per device, then sign in", () => {
    expect(signedOutTarget("/", false)).toBe("/welcome")
    expect(signedOutTarget("/", true)).toBe("/login")
  })

  it("sends deep links to sign in and back", () => {
    expect(signedOutTarget("/settings/security", false)).toBe("/login?next=%2Fsettings%2Fsecurity")
    expect(signedOutTarget("/settings/security?x=1", true)).toBe("/login?next=%2Fsettings%2Fsecurity%3Fx%3D1")
  })

  it("writes a long-lived, same-site cookie", () => {
    expect(welcomeSeenCookie(true)).toBe("pulse_welcome_seen=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure")
    expect(welcomeSeenCookie(false)).not.toContain("Secure")
  })
})
