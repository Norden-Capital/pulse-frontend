import { describe, expect, it } from "vitest"

import { FIRST_ROW, LAST_ROW, PERIOD, PHOTOS, STATIC_CELLS, collageColumns } from "./collage"

describe("welcome collage marquee", () => {
  const columns = collageColumns()

  it("alternates the direction, starting with up", () => {
    expect(columns.map((c) => c.col)).toEqual([-3, -2, -1, 0, 1, 2])
    expect(columns.map((c) => c.direction)).toEqual(["up", "down", "up", "down", "up", "down"])
  })

  it("repeats every column after one period, so the loop has no jump", () => {
    for (const { tiles } of columns) {
      expect(tiles[0].row).toBe(FIRST_ROW)
      expect(tiles.at(-1)!.row).toBe(LAST_ROW)
      // Enough rows to cover the view during the whole loop.
      expect(tiles.length).toBeGreaterThan(PERIOD)
      for (const tile of tiles) {
        const next = tiles.find((t) => t.row === tile.row + PERIOD)
        if (next) expect(next.photo).toBe(tile.photo)
        expect(PHOTOS[tile.photo]).toBeDefined()
      }
      // No photo directly above itself.
      tiles.slice(1).forEach((t, i) => expect(t.photo).not.toBe(tiles[i].photo))
    }
  })

  it("never slides a photo past itself in the next column", () => {
    for (let i = 1; i < columns.length; i++) {
      const left = new Set(columns[i - 1].tiles.map((t) => t.photo))
      for (const tile of columns[i].tiles) expect(left.has(tile.photo)).toBe(false)
    }
  })

  it("keeps the mockup's static collage for reduced motion", () => {
    expect(STATIC_CELLS).toHaveLength(24)
    expect(new Set(STATIC_CELLS.map(([c, r]) => `${c},${r}`)).size).toBe(24)
  })
})
