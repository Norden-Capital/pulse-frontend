import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Small parts shared by the sign-in, register and password pages, and by
// Settings → Security. Phone first: 44 px tall controls, 16 px text in inputs
// (no iOS zoom).

/** Classes for a full-width, 44 px tall button or link. */
export const BIG = "h-11 w-full text-sm"

/** A <Link> that looks like a button (Base UI's Button renders a <button>). */
export function LinkButton({
  href,
  variant = "outline",
  className,
  children,
}: {
  href: string
  variant?: "default" | "outline" | "ghost" | "link"
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant }), BIG, className)}>
      {children}
    </Link>
  )
}

/** The page heading: the word "Pulse", a title and a short line under it. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="text-center">
      <p className="text-sm font-semibold tracking-wide text-muted-foreground">Pulse</p>
      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-sm leading-snug text-muted-foreground">{subtitle}</p>}
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
        "rounded-lg px-4 py-3 text-sm leading-snug",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "success" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "info" && "bg-muted text-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

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
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {aside}
      </div>
      <Input
        id={id}
        className="h-11 text-base"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** "or" line between the password form and the Face ID button. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
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
