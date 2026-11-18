"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { BIG, PILL } from "./auth-ui"

/** "Sign out" with a confirm first (Spine): a tap by mistake must not end the session. */
export function SignOutButton() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    try {
      await api("/auth/logout", { method: "POST" })
    } catch {
      // Even if the call fails, leave; the server guards check again.
    }
    // Full page load on purpose: it drops every cached page of the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login")
  }

  return (
    <>
      <Button variant="destructive" className={BIG} onClick={() => setOpen(true)}>
        <LogOut aria-hidden />
        Sign out
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>You will need to sign in again on this device.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" className={PILL} onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" className={PILL} onClick={signOut} disabled={pending}>
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
