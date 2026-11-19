// Welcome collage (mockup 01, variant A): tiles on a grid tilted 48°.
//
// Moving: each column is a marquee. Its photos repeat every PERIOD tiles, so
// moving the column by PERIOD tiles looks exactly like the start and the loop
// has no jump. Neighbouring columns move in opposite directions and use
// different photos, so the same photo never slides past itself.
//
// Reduced motion: the mockup's static collage (STATIC_CELLS), unchanged.

export const PHOTOS = ["gym-lift", "cardio-run", "food-bowl", "home-pushup", "gym-barbell", "home-core"] as const

/** One tile plus the gap between tiles, in px. */
export const PITCH = 166
/** Tiles per loop in every column. */
export const PERIOD = 6
/** Rows drawn in each column: the visible rows (about -3..3) plus one period. */
export const FIRST_ROW = -3
export const LAST_ROW = 3 + PERIOD

/** The mockup's static collage: [column, row, photo index]. */
export const STATIC_CELLS: readonly (readonly [number, number, number])[] = [
  [-2, -1, 5], [-1, -2, 3], [-1, -1, 0], [0, -2, 2], [0, -1, 1], [1, -1, 3],
  [-2, 0, 1], [-1, 0, 2], [0, 0, 4], [1, 0, 5], [-1, 1, 0], [0, 1, 3],
  [1, -2, 4], [-2, 1, 4], [1, 1, 2], [2, -1, 0], [2, 0, 2], [-3, 0, 0],
  [-2, -2, 4], [0, 2, 5], [-1, 2, 1], [2, -2, 5], [-3, 1, 3], [1, 2, 1],
]

/**
 * Photos of each column. "Up" columns use gym-lift, food-bowl and
 * home-pushup; "down" columns use cardio-run, gym-barbell and home-core, each
 * starting at another photo. [a, b, c] fills the PERIOD rows as a b c b a c,
 * so the picture only repeats after a whole loop.
 */
const ORDERS: readonly (readonly number[])[] = [
  [0, 2, 3],
  [1, 4, 5],
  [2, 3, 0],
  [4, 5, 1],
  [3, 0, 2],
  [5, 1, 4],
]
const FIRST_COLUMN = -3

export type CollageColumn = { col: number; direction: "up" | "down"; tiles: { row: number; photo: number }[] }

const mod = (n: number, m: number) => ((n % m) + m) % m

/** Moving columns, left to right; the first moves up, the next down, and so on. */
export function collageColumns(): CollageColumn[] {
  return ORDERS.map(([a, b, c], index) => {
    const slots = [a, b, c, b, a, c]
    const tiles = []
    for (let row = FIRST_ROW; row <= LAST_ROW; row++) {
      tiles.push({ row, photo: slots[mod(row, PERIOD)] })
    }
    return { col: FIRST_COLUMN + index, direction: index % 2 === 0 ? "up" : "down", tiles }
  })
}
