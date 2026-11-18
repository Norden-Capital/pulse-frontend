"use client"

// The onboarding answers live in this tab only (sessionStorage), so back and
// refresh keep them, and closing the tab forgets them (health data). They are
// sent to the server only for the plan and with the register request.

import { useCallback, useMemo, useSyncExternalStore } from "react"
import { applyAnswers, parseDraft, type AnswerChange, type Draft } from "@/lib/onboarding/answers"
import type { Targets } from "@/lib/onboarding/types"

const KEY = "pulse:onboarding"
/** Set after register with a profile, so "Check your inbox" can say the plan is saved. */
const SAVED_KEY = "pulse:plan-saved"

const listeners = new Set<() => void>()

function readRaw(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ""
  } catch {
    return ""
  }
}

// If storage is blocked (private mode), keep the answers in memory for this page load.
let memory: string | null = null

function snapshot(): string {
  return memory ?? readRaw()
}

function write(draft: Draft) {
  const raw = JSON.stringify(draft)
  try {
    sessionStorage.setItem(KEY, raw)
    memory = null
  } catch {
    memory = raw
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Forget the answers (after the account is made). */
export function clearDraft() {
  memory = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing stored.
  }
  listeners.forEach((listener) => listener())
}

export function markPlanSaved() {
  try {
    sessionStorage.setItem(SAVED_KEY, "1")
  } catch {
    // Only changes a sentence on the next page.
  }
}

export function readPlanSaved(): boolean {
  try {
    return sessionStorage.getItem(SAVED_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * The current draft. `ready` is false during the server render and the first
 * browser render (storage is not readable there), so screens can wait before
 * deciding anything from the answers.
 */
export function useDraft() {
  // The server snapshot is null: "not read yet".
  const raw = useSyncExternalStore(subscribe, snapshot, () => null)
  const draft = useMemo(() => parseDraft(raw), [raw])

  const update = useCallback((change: AnswerChange) => write(applyAnswers(parseDraft(snapshot()), change)), [])
  const setTargets = useCallback((targets: Targets | null) => write({ ...parseDraft(snapshot()), targets }), [])

  return { draft, ready: raw !== null, update, setTargets }
}
