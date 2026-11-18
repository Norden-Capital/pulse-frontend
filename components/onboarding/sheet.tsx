"use client"

// Bottom sheet (mockup 12): Base UI Dialog for focus, Escape and the
// backdrop, drawn as a panel rising from the bottom with a grabber.

import { useRef, type ReactNode } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: ReactNode
}) {
  // Focus the sheet itself on open, not its first button (no ring on "Got it"
  // before the user did anything); Tab still moves through the sheet.
  const popup = useRef<HTMLDivElement>(null)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-(--sp-backdrop) transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <DialogPrimitive.Popup
          ref={popup}
          initialFocus={popup}
          className={
            "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92svh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-(--sp-sheet) " +
            "px-(--sp-gutter) pt-2.5 pb-[calc(12px+max(34px,env(safe-area-inset-bottom)))] text-(--sp-text) outline-none " +
            "transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full motion-reduce:transition-none"
          }
        >
          <div aria-hidden className="mx-auto mb-[18px] h-[5px] w-10 rounded-[3px] bg-(--sp-input-hover)" />
          <DialogPrimitive.Title className="text-xl font-medium">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-[13px] leading-[1.45] text-(--sp-text-muted)">
            {description}
          </DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export const SheetClose = DialogPrimitive.Close
