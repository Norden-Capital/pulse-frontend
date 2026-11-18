import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { PulseLogo } from "@/components/brand/pulse-logo"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Small parts shared by the sign-in, register and password pages, and by
// Settings → Security. Spine's look (components/spine-ui in Spine): pill
// buttons, filled inputs without a border, 16 px text in inputs (no iOS zoom).

/** Spine pill button, "md" size (44 px): dialogs and small actions. */
export const PILL =
  "h-11 rounded-full px-[18px] text-[13px] font-medium active:scale-[0.97] motion-reduce:active:scale-100 [&_svg:not([class*='size-'])]:size-[18px]"

/** Spine pill button, "lg" size (52 px), full width: the main actions of a form. */
export const BIG = cn(PILL, "h-[52px] w-full px-6 text-[14px]")

/** A <Link> that looks like a button (Base UI's Button renders a <button>). */
export function LinkButton({
  href,
  variant = "secondary",
  className,
  children,
}: {
  href: string
  variant?: "default" | "secondary" | "ghost" | "link"
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant }), BIG, className)}>
      {children}
    </Link>
  )
}

/**
 * The page heading (Spine's AuthHeader): the Pulse logo (mark + word), a big
 * title and a gray line under it.
 */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="flex flex-col items-center text-center">
      <PulseLogo />
      <h1 className="mt-10 font-heading text-[1.8125rem] leading-tight font-medium">{title}</h1>
      {subtitle && <p className="mt-2 text-[0.8125rem] leading-snug text-(--sp-text-muted)">{subtitle}</p>}
    </header>
  )
}

/** Message box above a form: red for errors, green for good news, plain for info. */
export function Notice({
  tone,
  children,
  className,
}: {
  tone: "danger" | "success" | "info"
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        // Spine's Notice: a soft tint of the status colour on the panel colour.
        "rounded-[16px] px-4 py-[14px] text-[0.8125rem] leading-snug",
        tone === "danger" && "bg-[color-mix(in_oklab,var(--sp-danger)_12%,var(--sp-panel))] text-(--sp-danger)",
        tone === "success" && "bg-[color-mix(in_oklab,var(--sp-success)_12%,var(--sp-panel))] text-(--sp-success)",
        tone === "info" && "bg-(--sp-panel) text-(--sp-text)",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Spine's input: 52 px, see-through fill, no border, violet focus ring, red when invalid. */
const INPUT =
  "h-[52px] rounded-[16px] border-0 bg-(--sp-input) px-4 text-(--sp-text) hover:bg-(--sp-input-hover) " +
  "placeholder:text-(--sp-input-placeholder) focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-(--sp-card-front) " +
  "aria-invalid:ring-2 aria-invalid:ring-(--sp-danger) dark:bg-(--sp-input) md:text-base"

/** Label, input, then a hint or an error line under it. */
export function Field({
  id,
  label,
  hint,
  error,
  aside,
  ...input
}: React.ComponentProps<typeof Input> & {
  id: string
  label: string
  hint?: string
  error?: string | null
  aside?: ReactNode
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="space-y-2">
      <div className="flex min-h-5 items-center justify-between gap-2 px-1">
        <Label htmlFor={id} className="text-[0.8125rem]">
          {label}
        </Label>
        {aside}
      </div>
      <Input id={id} className={INPUT} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} {...input} />
      {error ? (
        <p id={`${id}-error`} className="px-1 text-[0.6875rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="px-1 text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** "or" line between the password form and the Face ID button. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[0.6875rem] text-(--sp-text-faint)" aria-hidden>
      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--sp-text)_10%,transparent)]" />
      or
      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--sp-text)_10%,transparent)]" />
    </div>
  )
}

/** Fills the column and puts a short state (bad link, error) in the middle. */
export function CenteredState({
  title,
  text,
  children,
}: {
  title: string
  text: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <AuthHeader title={title} subtitle={text} />
      {children && <div className="mt-8 space-y-3">{children}</div>}
    </div>
  )
}
