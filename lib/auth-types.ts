// Types and small pure helpers shared by the server (proxy.ts, layouts) and
// the browser. No server or browser imports here, so `npm test` runs them.
// Shapes follow docs/api/auth.md.

/** POST /api/auth/login, POST /api/auth/passkey/login, GET /api/auth/me. */
export type CurrentUser = { id: string; email: string };

export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "DISABLED";

/** GET /api/me. */
export type Profile = CurrentUser & {
  status: UserStatus;
  createdAt: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  previousLoginAt: string | null;
};

/** GET /api/me/passkeys (one item). No key material is ever returned. */
export type Passkey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  /** This session was signed in with this passkey. */
  current: boolean;
};

/** GET /api/auth/token/{token}. */
export type TokenInfo = { email: string; purpose: "VERIFY" | "RESET" };

/** GET /api/me/sign-ins (one day; only days with at least one attempt). */
export type SignInDay = { date: string; ok: number; failed: number };

/** Server check of an email link token, done before the page renders. */
export type TokenCheck = { kind: "invalid" } | { kind: "error" } | { kind: "ready"; info: TokenInfo };

/** The backend's HttpOnly session cookie (Spring Session). proxy.ts only checks that it exists. */
export const SESSION_COOKIE_NAME = "SESSION";

/** Password policy (docs/api/auth.md §4): 12–128 characters, nothing else. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/** Passkey names: 1–60 characters after trimming. */
export const PASSKEY_NAME_MAX = 60;

// Guest-only pages: only for people NOT signed in (proxy.ts and the (auth)
// layout send a signed-in user to "/"). Everything else is private.
export const GUEST_ONLY_PATHS = [
  "/login",
  "/register",
  "/register-done",
  "/verify-email",
  "/forgot-password",
  "/set-password",
];

/** Is `pathname` one of the guest-only pages (or below one)? */
export function isGuestPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Only allow same-site paths like "/settings/security", never "//evil.com" or "/\evil.com". */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}

/** Problem with a new password, or null if it fits the policy. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  return null;
}
