"use client"

// Welcome, variant A (mockup 01): photo tiles on a grid tilted 48°, the
// angle of the logo's bars, fading into the title. Each column slowly
// scrolls along its own axis, neighbours in opposite directions (CSS
// transform only, see globals.css); with reduced motion it is the mockup's
// static collage. Photos are Unsplash (CREDITS.md), shown in greyscale to
// match the black-and-white brand.

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { PERIOD, PHOTOS, PITCH, STATIC_CELLS, collageColumns } from "@/lib/onboarding/collage"
import { WELCOME_SEEN_KEY, welcomeSeenCookie } from "@/lib/onboarding/routing"
import { PILL_PRIMARY } from "./onboarding-ui"

const COLUMNS = collageColumns()

/** A 150 px tile; the photo inside turns back upright. */
function Tile({ photo, left, top }: { photo: number; left: number; top: number }) {
  return (
    <div className="absolute size-[150px] overflow-hidden rounded-[34px] bg-(--sp-input)" style={{ left, top }}>
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
  )
}

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
        {/* Moving collage: one marquee per column. */}
        <div className="collage-moving absolute top-[48.4%] left-1/2 size-0 rotate-48">
          {COLUMNS.map(({ col, direction, tiles }) => (
            <div
              key={col}
              data-direction={direction}
              className="collage-column absolute top-0 size-0"
              style={{ left: col * PITCH, ["--collage-period" as string]: `${PERIOD * PITCH}px` }}
            >
              {tiles.map(({ row, photo }) => (
                <Tile key={row} photo={photo} left={0} top={row * PITCH} />
              ))}
            </div>
          ))}
        </div>
        {/* Reduced motion: the mockup's static collage. */}
        <div className="collage-static absolute top-[48.4%] left-1/2 size-0 rotate-48">
          {STATIC_CELLS.map(([col, row, photo]) => (
            <Tile key={`${col},${row}`} photo={photo} left={col * PITCH} top={row * PITCH} />
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
