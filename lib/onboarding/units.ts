// Metric <-> imperial for the onboarding pickers. The API stores metric only
// (cm, kg, at most 1 decimal), so imperial input is converted before sending:
// 1 in = 2.54 cm, 1 lb = 0.45359237 kg, rounded to 0.1 (contract §1).
//
// The pickers count in whole "ticks": 1 cm or 1 in for height, 0.1 kg or
// 1 lb for weight. Whole inches and pounds survive the trip through metric
// (the rounding error is far below half a unit), so a value never drifts.

import type { Units } from "./types"

export const CM_PER_IN = 2.54
export const KG_PER_LB = 0.45359237

/** API limits (contract §1). */
export const HEIGHT_CM = { min: 120, max: 230 } as const
export const WEIGHT_KG = { min: 30, max: 300 } as const
/** Hub decision Q1: adults only. */
export const AGE_YEARS = { min: 18, max: 100 } as const

/** Round to one decimal, half away from zero (for positive numbers: half up). */
export function round1(value: number): number {
  return Math.round(value * 10 + Number.EPSILON) / 10
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function inchesToCm(inches: number): number {
  return round1(inches * CM_PER_IN)
}

export function cmToInches(cm: number): number {
  return Math.round(cm / CM_PER_IN)
}

export function lbToKg(lb: number): number {
  return round1(lb * KG_PER_LB)
}

export function kgToLb(kg: number): number {
  return Math.round(kg / KG_PER_LB)
}

/** 71 → { ft: 5, in: 11 }. */
export function splitFeet(inches: number): { ft: number; in: number } {
  return { ft: Math.floor(inches / 12), in: inches % 12 }
}

/** Picker scale for height or weight in one unit system. */
export type Scale = {
  /** Smallest and largest tick that stays inside the API limits. */
  min: number
  max: number
  /** Metric value (cm or kg) → tick. */
  toTick: (metric: number) => number
  /** Tick → metric value to store and send. */
  toMetric: (tick: number) => number
  /** Ticks between labelled marks on the ruler. */
  majorEvery: number
  /** Ruler label for a tick. */
  label: (tick: number) => string
}

const metricHeight: Scale = {
  min: HEIGHT_CM.min,
  max: HEIGHT_CM.max,
  toTick: (cm) => Math.round(cm),
  toMetric: (tick) => tick,
  majorEvery: 5,
  label: (tick) => String(tick),
}

const imperialHeight: Scale = {
  // 48 in = 121.9 cm, 90 in = 228.6 cm.
  min: Math.ceil(HEIGHT_CM.min / CM_PER_IN),
  max: Math.floor(HEIGHT_CM.max / CM_PER_IN),
  toTick: cmToInches,
  toMetric: inchesToCm,
  majorEvery: 6,
  label: (tick) => {
    const { ft, in: inch } = splitFeet(tick)
    return inch === 0 ? `${ft}′` : `${ft}′${inch}″`
  },
}

const metricWeight: Scale = {
  // Ticks of 0.1 kg.
  min: WEIGHT_KG.min * 10,
  max: WEIGHT_KG.max * 10,
  toTick: (kg) => Math.round(kg * 10),
  toMetric: (tick) => round1(tick / 10),
  majorEvery: 5,
  label: (tick) => String(tick / 10),
}

const imperialWeight: Scale = {
  // 67 lb = 30.4 kg, 661 lb = 299.8 kg: whole pounds inside the API range.
  min: Math.ceil(WEIGHT_KG.min / KG_PER_LB),
  max: Math.floor(WEIGHT_KG.max / KG_PER_LB),
  toTick: kgToLb,
  toMetric: lbToKg,
  majorEvery: 5,
  label: (tick) => String(tick),
}

/** Goal weight moves in coarser steps: 0.5 kg or 1 lb. */
const metricGoalWeight: Scale = {
  min: WEIGHT_KG.min * 2,
  max: WEIGHT_KG.max * 2,
  toTick: (kg) => Math.round(kg * 2),
  toMetric: (tick) => tick / 2,
  majorEvery: 2,
  label: (tick) => String(tick / 2),
}

export function heightScale(units: Units): Scale {
  return units === "IMPERIAL" ? imperialHeight : metricHeight
}

export function weightScale(units: Units): Scale {
  return units === "IMPERIAL" ? imperialWeight : metricWeight
}

export function goalWeightScale(units: Units): Scale {
  return units === "IMPERIAL" ? imperialWeight : metricGoalWeight
}

/** Height for display: "180 cm" or "5 ft 11 in". */
export function formatHeight(cm: number, units: Units): string {
  if (units === "IMPERIAL") {
    const { ft, in: inch } = splitFeet(cmToInches(cm))
    return `${ft} ft ${inch} in`
  }
  return `${Math.round(cm)} cm`
}

/** Weight number for display, without the unit: "78.0" kg or "172" lb. */
export function weightNumber(kg: number, units: Units): string {
  return units === "IMPERIAL" ? String(kgToLb(kg)) : kg.toFixed(1)
}

/** Short weight for sentences: "78" or "78.5" (kg), "172" (lb). */
export function shortWeight(kg: number, units: Units): string {
  return units === "IMPERIAL" ? String(kgToLb(kg)) : String(round1(kg))
}

export function weightUnit(units: Units): "kg" | "lb" {
  return units === "IMPERIAL" ? "lb" : "kg"
}
