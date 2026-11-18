import { cn } from "cn"

// The Pulse mark, from the Art Director's brand/logo/pulse-mark.svg (viewBox
// 256 x 260, unchanged geometry). Filled with currentColor, so it follows the
// text colour in light and dark. To update it, copy the new shapes here.

/** The mark alone. Size it with a height class (the width follows). */
export function PulseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 260" fill="currentColor" aria-hidden className={cn("h-6 w-auto shrink-0", className)}>
      <circle cx="215.39" cy="40.89" r="39.85" />
      <circle cx="36.98" cy="213.84" r="36.22" />
      <path d="M106.97 10.34 L236.86 154.87 A24.51 24.51 0 1 1 200.41 187.63 L163.71 146.81 A12.45 12.45 0 0 0 142.01 154.89 A33.73 33.73 0 0 0 150.65 178.07 L181.73 212.64 A28.31 28.31 0 0 1 139.62 250.49 L21.36 118.92 A23.7 23.7 0 0 1 56.61 87.23 L114.61 151.77 A11.75 11.75 0 0 0 135.1 143.71 A34.51 34.51 0 0 0 126.26 121.25 L62.5 50.31 A29.9 29.9 0 0 1 106.97 10.34Z" />
    </svg>
  )
}

/** Mark + the word "Pulse" (Poppins, the app font), side by side. */
export function PulseLogo({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Pulse" className={cn("inline-flex items-center gap-2 text-(--sp-text)", className)}>
      <PulseMark className="h-[22px]" />
      <span aria-hidden className="text-[1.125rem] leading-none font-semibold tracking-tight">
        Pulse
      </span>
    </span>
  )
}
