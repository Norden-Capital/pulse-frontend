"use client"

// Welcome, variant A (mockup 01): photo tiles on a grid tilted 48°, the
// angle of the logo's bars, fading into the title. Photos are Unsplash
// (CREDITS.md), shown in greyscale to match the black-and-white brand.

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { WELCOME_SEEN_KEY, welcomeSeenCookie } from "@/lib/onboarding/routing"
import { PILL_PRIMARY } from "./onboarding-ui"

const PHOTOS = ["gym-lift", "cardio-run", "food-bowl", "home-pushup", "gym-barbell", "home-core"] as const

/** Grid cell [column, row] → photo index, exactly as in the mockup. */
const CELLS: [number, number, number][] = [
  [-2, -1, 5], [-1, -2, 3], [-1, -1, 0], [0, -2, 2], [0, -1, 1], [1, -1, 3],
  [-2, 0, 1], [-1, 0, 2], [0, 0, 4], [1, 0, 5], [-1, 1, 0], [0, 1, 3],
  [1, -2, 4], [-2, 1, 4], [1, 1, 2], [2, -1, 0], [2, 0, 2], [-3, 0, 0],
  [-2, -2, 4], [0, 2, 5], [-1, 2, 1], [2, -2, 5], [-3, 1, 3], [1, 2, 1],
]
const PITCH = 166 // 150 px tile + 16 px gap

/** Remember that this device has seen the welcome screen (proxy.ts reads the cookie). */
function markSeen() {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "1")
  } catch {
    // Storage blocked: the cookie alone is enough.
  }
  document.cookie = welcomeSeenCookie(window.location.protocol === "https:")
}

export function WelcomeScreen() {
  useEffect(markSeen, [])

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="relative min-h-[320px] flex-1 overflow-hidden after:absolute after:inset-x-0 after:top-0 after:z-[2] after:h-[74px] after:bg-[linear-gradient(color-mix(in_oklab,var(--sp-bg)_92%,transparent),transparent)]"
      >
        <div className="absolute top-[48.4%] left-1/2 size-0 rotate-48">
          {CELLS.map(([col, row, photo]) => (
            <div
              key={`${col},${row}`}
              className="absolute size-[150px] overflow-hidden rounded-[34px] bg-(--sp-input)"
              style={{ left: col * PITCH, top: row * PITCH }}
            >
              <Image
                src={`/welcome/${PHOTOS[photo]}.webp`}
                alt=""
                width={236}
                height={236}
                unoptimized
                loading="eager"
                className="absolute top-1/2 left-1/2 -mt-[118px] -ml-[118px] size-[236px] max-w-none -rotate-48 object-cover grayscale-100 contrast-[1.08]"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[230px] bg-[linear-gradient(transparent,var(--sp-bg)_82%)]" />
      </div>

      <div className="relative z-[3] -mt-3 px-(--sp-gutter) pb-3 text-center">
        <h1 className="text-[32px] leading-[1.15] font-medium tracking-[-0.01em]">Welcome to Pulse</h1>
        <p className="mt-2.5 mb-[30px] text-sm text-(--sp-text-muted)">Log workouts and food. See your progress.</p>
        <Link href="/start/goal" className={PILL_PRIMARY}>
          Get started
        </Link>
        <p className="mt-3.5 pt-1.5 pb-0.5 text-sm text-(--sp-text-muted)">
          I already have an account ·{" "}
          <Link href="/login" className="font-medium text-(--sp-text) underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
