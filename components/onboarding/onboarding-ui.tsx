"use client"

// Building blocks of the onboarding screens, measured from the approved
// mockups (brand/mockups/onboarding/onboarding.html). Buttons, inputs and
// colours are the same Spine tokens and pills as the sign-in pages (auth-ui.tsx).

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { BackIcon, CheckIcon, MinusIcon, PlusIcon } from "./icons"

export const TOTAL_STEPS = 8

/** Round 44 px button with the text colour at 7 % (Spine's soft button). */
const ICON_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-(--sp-text) transition-[background-color,scale] " +
  "hover:bg-(--sp-input-hover) active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front)"

/** Back button, and the progress bar with "n/8" on question screens. */
export function TopBar({ back, step }: { back: string; step?: number }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3.5">
      <Link href={back} className={ICON_BUTTON} aria-label="Back">
        <BackIcon />
      </Link>
      {step !== undefined && (
        <>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-(--sp-input)"
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step}
          >
            <i
              className="block h-full rounded-[3px] bg-(--sp-text) transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="w-7 text-right text-xs text-(--sp-text-muted) tabular-nums">
            {step}/{TOTAL_STEPS}
          </span>
        </>
      )}
    </div>
  )
}

/** One question: top bar, big left-aligned title, grey line, content, and a sticky main button. */
export function QuestionScreen({
  step,
  back,
  title,
  subtitle,
  titleId,
  children,
  footer,
}: {
  step?: number
  back: string
  title: string
  subtitle?: ReactNode
  titleId?: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col px-(--sp-gutter) pt-2">
      <TopBar back={back} step={step} />
      <h1 id={titleId} className="mt-[26px] text-[26px] leading-[1.22] font-medium tracking-[-0.01em]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-[13px] leading-[1.45] text-(--sp-text-muted)">{subtitle}</p>}
      {children}
      <Footer>{footer}</Footer>
    </div>
  )
}

/** Main actions at the bottom; stays in view on short screens. */
export function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("sticky bottom-0 mt-auto flex flex-col gap-3 bg-(--sp-bg) pt-6 pb-3", className)}>{children}</div>
  )
}

/** Big pill (52 px) as in auth-ui's BIG, primary or soft. */
export const PILL_BIG =
  "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-[14px] font-medium " +
  "transition-[background-color,scale,opacity] outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front) " +
  "active:scale-[0.97] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-40"
export const PILL_PRIMARY = cn(PILL_BIG, "bg-(--sp-chip-active) text-(--sp-chip-active-text) hover:opacity-90")
export const PILL_SECONDARY = cn(PILL_BIG, "bg-secondary text-(--sp-text) hover:bg-(--sp-input-hover)")

/** A choice row: icon tile, title, grey line, round (single) or square (multi) mark. 72 px tall. */
export function OptionRow({
  icon,
  title,
  sub,
  selected,
  multi,
  onSelect,
}: {
  icon?: ReactNode
  title: string
  sub?: string
  selected: boolean
  multi?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[18px] bg-(--sp-panel) px-4 py-3 text-left transition-[box-shadow,scale]",
        "outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front) active:scale-[0.99] motion-reduce:active:scale-100",
        sub ? "min-h-[72px]" : "min-h-[60px]",
        selected ? "shadow-[inset_0_0_0_2px_var(--sp-text)]" : "shadow-[inset_0_0_0_2px_transparent]"
      )}
    >
      {icon && (
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-[14px]",
            selected ? "bg-(--sp-text) text-(--sp-bg)" : "bg-(--sp-input)"
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] leading-[1.3] font-medium">{title}</b>
        {sub && <small className="mt-0.5 block text-xs leading-[1.4] text-(--sp-text-muted)">{sub}</small>}
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-6 shrink-0 place-items-center",
          multi ? "rounded-lg" : "rounded-full",
          selected ? "bg-(--sp-text) text-(--sp-bg)" : "shadow-[inset_0_0_0_2px_var(--sp-text-faint)]"
        )}
      >
        {selected && <CheckIcon />}
      </span>
    </button>
  )
}

/** Column of OptionRows. `labelledBy` is the question title's id. */
export function Options({
  labelledBy,
  multi,
  className,
  children,
}: {
  labelledBy: string
  multi?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-labelledby={labelledBy}
      className={cn("mt-[26px] flex flex-col gap-2.5", className)}
    >
      {children}
    </div>
  )
}

/** Small two-way switch (cm / ft · in, kg / lb). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="mt-6 flex justify-center">
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-(--sp-input) p-1">
        {options.map((option) => {
          const on = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(option.value)}
              className={cn(
                "grid h-8 place-items-center rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap outline-none",
                "focus-visible:ring-2 focus-visible:ring-(--sp-card-front)",
                on ? "bg-(--sp-panel) text-(--sp-text) shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-(--sp-text-muted)"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Row of equal chips, one selected (workouts per week). */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <>
      <div id={id} className="mx-0 mt-[22px] mb-2.5 px-1 text-[13px] font-medium">
        {label}
      </div>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-2">
        {options.map((option) => {
          const on = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(option.value)}
              className={cn(
                "grid h-[52px] flex-1 place-items-center rounded-2xl text-[15px] font-medium transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-(--sp-card-front)",
                on ? "bg-(--sp-text) text-(--sp-bg)" : "bg-(--sp-panel)"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Calls `step` once on press, then repeats while held (for − / + buttons). */
function useHoldRepeat(step: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(step)
  useEffect(() => {
    latest.current = step
  })
  const stop = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])
  return {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.button !== 0) return
      latest.current()
      const repeat = (delay: number) => {
        timer.current = setTimeout(() => {
          latest.current()
          repeat(Math.max(35, delay * 0.85))
        }, delay)
      }
      repeat(400)
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    // Keyboard and screen readers: a click without a pointer press.
    onClick: (event: React.MouseEvent) => {
      if (event.detail === 0) latest.current()
    },
  }
}

/** Round − / + button. Hold to repeat. */
export function StepButton({
  kind,
  label,
  onStep,
  disabled,
  small,
}: {
  kind: "minus" | "plus"
  label: string
  onStep: () => void
  disabled?: boolean
  small?: boolean
}) {
  const hold = useHoldRepeat(onStep)
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      {...hold}
      className={cn(
        "grid shrink-0 touch-manipulation place-items-center rounded-full transition-[scale,opacity] select-none outline-none",
        "focus-visible:ring-2 focus-visible:ring-(--sp-card-front) active:scale-95 disabled:opacity-35",
        small ? "size-11 bg-(--sp-input)" : "size-14 bg-(--sp-panel)"
      )}
    >
      {kind === "minus" ? <MinusIcon /> : <PlusIcon />}
    </button>
  )
}

/**
 * The big value between − and +. With `parse`, the number is also a text
 * field: tap it and type (quicker than stepping 0.1 kg at a time).
 */
export function ValueStepper({
  display,
  unit,
  label,
  onStep,
  atMin,
  atMax,
  parse,
  inputMode = "decimal",
  children,
}: {
  display: string
  unit?: string
  label: string
  onStep: (delta: number) => void
  atMin: boolean
  atMax: boolean
  /** Text → new value applied (true), or not a valid value (false). */
  parse?: (text: string) => boolean
  inputMode?: "decimal" | "numeric"
  children?: ReactNode
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const commit = () => {
    if (editing !== null && parse) parse(editing.replace(",", "."))
    setEditing(null)
  }
  return (
    <div className="mt-[30px] flex items-center justify-between gap-2">
      <StepButton kind="minus" label={`Less ${label.toLowerCase()}`} onStep={() => onStep(-1)} disabled={atMin} />
      <div className="flex min-w-0 items-baseline justify-center">
        {children ??
          (parse ? (
            <input
              aria-label={unit ? `${label} in ${unit}` : label}
              inputMode={inputMode}
              enterKeyHint="done"
              autoComplete="off"
              value={editing ?? display}
              onFocus={(e) => {
                setEditing(display)
                e.currentTarget.select()
              }}
              onChange={(e) => setEditing(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur()
                if (e.key === "Escape") {
                  setEditing(null)
                  e.currentTarget.blur()
                }
              }}
              size={Math.max(2, (editing ?? display).length)}
              className="min-w-0 bg-transparent p-0 text-center text-[52px]! leading-none font-semibold tracking-[-0.02em] tabular-nums outline-none [field-sizing:content] focus:underline focus:decoration-(--sp-text-faint) focus:decoration-2 focus:underline-offset-8"
            />
          ) : (
            <b className="text-[52px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{display}</b>
          ))}
        {unit && !children && <span className="ml-1.5 text-[17px] font-medium text-(--sp-text-muted)">{unit}</span>}
      </div>
      <StepButton kind="plus" label={`More ${label.toLowerCase()}`} onStep={() => onStep(1)} disabled={atMax} />
    </div>
  )
}

const TICK = 11 // px between ticks (2 px tick + 9 px gap), as in the mockup
const SIDE_TICKS = 24

/** Horizontal tape. Drag it, or use the arrow keys. One tick = one picker step. */
export function Ruler({
  value,
  min,
  max,
  majorEvery,
  label,
  valueText,
  tickLabel,
  onChange,
}: {
  value: number
  min: number
  max: number
  majorEvery: number
  label: string
  valueText: string
  tickLabel: (tick: number) => string
  onChange: (value: number) => void
}) {
  const drag = useRef<{ x: number; value: number; id: number } | null>(null)
  const set = (next: number) => {
    const v = Math.min(max, Math.max(min, Math.round(next)))
    if (v !== value) onChange(v)
  }

  const ticks: ReactNode[] = []
  const labels: ReactNode[] = []
  for (let i = -SIDE_TICKS; i <= SIDE_TICKS; i++) {
    const tick = value + i
    if (tick < min || tick > max) continue
    const major = tick % majorEvery === 0
    const left = `calc(50% + ${i * TICK}px)`
    ticks.push(
      <i
        key={tick}
        className={cn(
          "absolute top-3.5 w-0.5 -translate-x-1/2 rounded-[1px] bg-(--sp-text-faint)",
          major ? "h-[34px] opacity-90" : "h-[18px] opacity-55"
        )}
        style={{ left }}
      />
    )
    if (major && Math.abs(i) <= 12) {
      labels.push(
        <span
          key={tick}
          className="absolute bottom-2.5 -translate-x-1/2 text-[11px] whitespace-nowrap text-(--sp-text-muted) tabular-nums"
          style={{ left }}
        >
          {tickLabel(tick)}
        </span>
      )
    }
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className="relative mt-7 h-[84px] cursor-grab touch-pan-y overflow-hidden rounded-[18px] bg-(--sp-panel) outline-none select-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front) active:cursor-grabbing"
      onPointerDown={(e) => {
        if (e.button !== 0) return
        drag.current = { x: e.clientX, value, id: e.pointerId }
        try {
          // Keep getting moves when the finger leaves the tape.
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // Not an active pointer (synthetic event): dragging still works inside.
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        // Pull the tape left to go up, like a real tape under a fixed needle.
        set(d.value + Math.round((d.x - e.clientX) / TICK))
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        const moves: Record<string, number> = {
          ArrowLeft: -1,
          ArrowDown: -1,
          ArrowRight: 1,
          ArrowUp: 1,
          PageDown: -majorEvery,
          PageUp: majorEvery,
        }
        if (e.key in moves) set(value + moves[e.key])
        else if (e.key === "Home") set(min)
        else if (e.key === "End") set(max)
        else return
        e.preventDefault()
      }}
    >
      <div aria-hidden>
        {ticks}
        {labels}
      </div>
      <div aria-hidden className="absolute top-2 left-1/2 h-12 w-1 -translate-x-1/2 rounded-sm bg-(--sp-text)" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--sp-panel),transparent_30%,transparent_70%,var(--sp-panel))]"
      />
    </div>
  )
}

const ROW = 46 // px per wheel row
const WHEEL_HEIGHT = 330

/** Vertical wheel (age). Scroll, tap a row, or use the arrow keys. */
export function Wheel({
  value,
  min,
  max,
  unit,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  unit: string
  label: string
  onChange: (value: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  // Keep the scroll position on the value (first render, keys, taps).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const top = (value - min) * ROW
    if (Math.abs(el.scrollTop - top) > ROW / 2) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollTo({ top, behavior: el.dataset.ready && !reduce ? "smooth" : "instant" })
    }
    el.dataset.ready = "1"
  }, [value, min])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const set = (next: number) => {
    const v = Math.min(max, Math.max(min, next))
    if (v !== value) onChange(v)
  }

  const rows: ReactNode[] = []
  for (let v = min; v <= max; v++) {
    const d = Math.abs(v - value)
    rows.push(
      <div
        key={v}
        onClick={() => set(v)}
        className={cn(
          "relative flex h-[46px] snap-center items-center justify-center tabular-nums",
          d === 0 ? "text-[34px] font-semibold text-(--sp-text)" : "cursor-pointer text-(--sp-text-faint)"
        )}
        style={d === 0 ? undefined : { fontSize: Math.max(14, 26 - d * 3), opacity: Math.max(0, 1 - d * 0.22) }}
      >
        {v}
        {d === 0 && (
          <em className="absolute left-[calc(50%+34px)] text-[15px] font-medium text-(--sp-text-muted) not-italic">
            {unit}
          </em>
        )}
      </div>
    )
  }

  return (
    <div className="relative mt-[34px]" style={{ height: WHEEL_HEIGHT }}>
      <div aria-hidden className="absolute inset-x-0 top-1/2 -mt-8 h-16 rounded-[18px] bg-(--sp-panel)" />
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} ${unit}`}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[18px] outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-(--sp-card-front) [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: (WHEEL_HEIGHT - ROW) / 2 }}
        onScroll={(e) => {
          const el = e.currentTarget
          cancelAnimationFrame(frame.current)
          frame.current = requestAnimationFrame(() => set(min + Math.round(el.scrollTop / ROW)))
        }}
        onKeyDown={(e) => {
          const moves: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }
          if (e.key in moves) set(value + moves[e.key])
          else if (e.key === "Home") set(min)
          else if (e.key === "End") set(max)
          else return
          e.preventDefault()
        }}
      >
        {rows}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--sp-bg),transparent_32%,transparent_68%,var(--sp-bg))]"
      />
    </div>
  )
}

/** On / off switch (iOS size, 51 × 31). */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front)",
        checked ? "bg-(--sp-text)" : "bg-(--sp-input-hover)"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 size-[27px] rounded-full shadow-[0_2px_4px_rgb(0_0_0/0.15)] transition-[left] motion-reduce:transition-none",
          checked ? "left-[22px] bg-(--sp-bg)" : "left-0.5 bg-white"
        )}
      />
    </button>
  )
}

/** "≈ Estimated" / "Adjusted" pill. */
export function Badge({ icon, children, small }: { icon: ReactNode; children: ReactNode; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-(--sp-input) pr-3 pl-2.5 font-medium text-(--sp-text)",
        small ? "h-6 text-[11px]" : "h-7 text-xs"
      )}
    >
      {icon}
      {children}
    </span>
  )
}
