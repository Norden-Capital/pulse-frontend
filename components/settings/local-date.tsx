"use client"

import { useSyncExternalStore } from "react"

const noSubscribe = () => () => {}

/**
 * A date or date-time in the viewer's own locale and time zone. The server
 * does not know the viewer's zone, so it renders the plain ISO day and the
 * browser swaps in the local text after hydration (no mismatch).
 */
export function LocalDate({ iso, withTime = false }: { iso: string; withTime?: boolean }) {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false)
  const date = new Date(iso)
  const text = !inBrowser
    ? iso.slice(0, 10)
    : withTime
      ? date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : date.toLocaleDateString(undefined, { dateStyle: "medium" })
  return <time dateTime={iso}>{text}</time>
}

/** A "YYYY-MM-DD" calendar day (already cut in the right zone by the backend), e.g. "Mon, 16 Nov". */
export function DayLabel({ day }: { day: string }) {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false)
  const text = inBrowser
    ? new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : day
  return <time dateTime={day}>{text}</time>
}
