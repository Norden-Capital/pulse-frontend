"use client"

// The email someone just registered with, kept in this tab only
// (sessionStorage), so /register-done can show it and resend the link
// without putting the address in the URL (URLs end up in logs and history).

const KEY = "pulse:pending-email"

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email)
  } catch {
    // Private mode or storage blocked: the page asks for the email instead.
  }
}

export function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}
