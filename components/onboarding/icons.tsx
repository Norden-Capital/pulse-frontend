// The onboarding mockup's own line icons (brand/mockups/onboarding/onboarding.html):
// 24 px grid, round caps, stroke = currentColor. Kept as drawn so the screens
// match the approved design.

import type { ReactNode } from "react"

function Icon({ size = 22, stroke = 2, children }: { size?: number; stroke?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {children}
    </svg>
  )
}

export const BackIcon = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)
export const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <Icon size={size} stroke={2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)
export const MinusIcon = () => (
  <Icon size={24}>
    <path d="M6 12h12" />
  </Icon>
)
export const PlusIcon = () => (
  <Icon size={24}>
    <path d="M12 6v12M6 12h12" />
  </Icon>
)
export const InfoIcon = () => (
  <Icon size={16}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.1" />
  </Icon>
)
export const ApproxIcon = () => (
  <Icon size={14} stroke={2.2}>
    <path d="M5 9.5c2-2 4-2 7 0s5 2 7 0M5 15.5c2-2 4-2 7 0s5 2 7 0" />
  </Icon>
)
export const PencilIcon = () => (
  <Icon size={14} stroke={2.2}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
  </Icon>
)
export const DownIcon = () => (
  <Icon>
    <path d="M4 7l6 6 4-4 6 6" />
    <path d="M20 12v5h-5" />
  </Icon>
)
export const EqualIcon = () => (
  <Icon>
    <path d="M5 9h14M5 15h14" />
  </Icon>
)
export const DumbbellIcon = () => (
  <Icon>
    <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </Icon>
)
export const HomeIcon = () => (
  <Icon>
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6 9.5V19h12V9.5" />
    <path d="M10 19v-5h4v5" />
  </Icon>
)
export const RunIcon = () => (
  <Icon>
    <circle cx="14.5" cy="4.8" r="1.8" />
    <path d="M8 21l3-5.5 3 2.5V22M6 12.5l3-3.5 4 1 2.5 3.5H19M9 9l-1.5 4.5 3.5 2" />
  </Icon>
)
export const MaleIcon = () => (
  <Icon>
    <circle cx="10" cy="14" r="5.5" />
    <path d="M14 10l6-6M15 4h5v5" />
  </Icon>
)
export const FemaleIcon = () => (
  <Icon>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M12 14.5V21M9 18h6" />
  </Icon>
)
export const DashIcon = () => (
  <Icon>
    <path d="M8 12h8" />
  </Icon>
)
export const SitIcon = () => (
  <Icon>
    <path d="M5 18h14M7 18v-5h10v5M9 13V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
  </Icon>
)
export const WalkIcon = () => (
  <Icon>
    <circle cx="12" cy="4.6" r="1.8" />
    <path d="M9 21l2-6 3 3v3M8 11l3-3 3 1.5 2 2.5M11 8l-1 6" />
  </Icon>
)
export const StandIcon = () => (
  <Icon>
    <circle cx="12" cy="4.6" r="1.8" />
    <path d="M12 8v7M9 21l3-6 3 6M8 11h8" />
  </Icon>
)
export const BoltIcon = () => (
  <Icon>
    <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
  </Icon>
)
export const MailIcon = () => (
  <Icon size={30} stroke={1.8}>
    <rect x="3" y="5.5" width="18" height="13" rx="3" />
    <path d="M4 7.5l8 6 8-6" />
  </Icon>
)
