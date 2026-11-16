import { describe, expect, it } from "vitest"

import { ApiError, errorFrom, errorMessage, readCookie } from "./api"
import { isGuestPath, passwordProblem, safeNextPath } from "./auth-types"
import { defaultPasskeyName, fromB64url, toB64url } from "./passkeys"
import { signInsQuery, summarizeSignIns } from "./sign-ins"
import { tokenCheckFrom, tokenParam } from "./token-result"

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/settings/security")).toBe("/settings/security")
    expect(safeNextPath("/settings/security?x=1")).toBe("/settings/security?x=1")
  })

  it("refuses anything that could leave the site", () => {
    for (const value of [null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "evil"]) {
      expect(safeNextPath(value), String(value)).toBe("/")
    }
  })
})

describe("isGuestPath", () => {
  it("matches the auth pages and below them", () => {
    for (const path of ["/login", "/register", "/register-done", "/verify-email", "/forgot-password", "/set-password"]) {
      expect(isGuestPath(path), path).toBe(true)
    }
    expect(isGuestPath("/login/extra")).toBe(true)
  })

  it("does not match private pages or look-alikes", () => {
    for (const path of ["/", "/settings/security", "/loginx", "/registered"]) {
      expect(isGuestPath(path), path).toBe(false)
    }
  })
})

describe("passwordProblem", () => {
  it("follows the 12–128 character policy", () => {
    expect(passwordProblem("a".repeat(11))).toMatch(/at least 12/)
    expect(passwordProblem("a".repeat(12))).toBeNull()
    expect(passwordProblem("a".repeat(128))).toBeNull()
    expect(passwordProblem("a".repeat(129))).toMatch(/at most 128/)
  })
})

describe("errorFrom", () => {
  it("uses the backend's error code for the message", () => {
    const err = errorFrom(401, JSON.stringify({ error: "invalid_credentials", message: "Bad credentials" }))
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe("invalid_credentials")
    expect(err.status).toBe(401)
    expect(err.message).toBe("Email or password is wrong.")
  })

  it("knows the codes the auth pages switch on", () => {
    for (const code of ["email_not_verified", "csrf_invalid", "token_invalid", "weak_password", "passkey_invalid"]) {
      expect(errorFrom(400, JSON.stringify({ error: code })).code).toBe(code)
    }
  })

  it("falls back to the status, then a generic text", () => {
    expect(errorFrom(429, "not json").message).toMatch(/Too many attempts/)
    expect(errorFrom(418, "").message).toBe("Something went wrong. Please try again.")
    expect(errorFrom(500, "null").code).toBe("unknown_error")
  })

  it("errorMessage hides non-API errors behind the generic text", () => {
    expect(errorMessage(new Error("secret detail"))).toBe("Something went wrong. Please try again.")
  })
})

describe("readCookie", () => {
  it("reads one cookie out of document.cookie", () => {
    expect(readCookie("a=1; XSRF-TOKEN=abc%3D; b=2", "XSRF-TOKEN")).toBe("abc=")
    expect(readCookie("XSRF-TOKEN-OLD=x", "XSRF-TOKEN")).toBeNull()
    expect(readCookie("", "XSRF-TOKEN")).toBeNull()
  })

  it("ignores a badly encoded value", () => {
    expect(readCookie("XSRF-TOKEN=%E0%A4%A", "XSRF-TOKEN")).toBeNull()
  })
})

describe("base64url", () => {
  it("round-trips bytes, without padding", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])
    const encoded = toB64url(bytes.buffer)!
    expect(encoded).not.toMatch(/[+/=]/)
    expect(new Uint8Array(fromB64url(encoded))).toEqual(bytes)
  })

  it("decodes the WebAuthn spec's example values", () => {
    expect(new TextDecoder().decode(fromB64url("aGVsbG8"))).toBe("hello")
    expect(toB64url(null)).toBeUndefined()
  })
})

describe("defaultPasskeyName", () => {
  it("names the device from its user agent", () => {
    expect(defaultPasskeyName("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("iPhone")
    expect(defaultPasskeyName("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("iPad")
    expect(defaultPasskeyName("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe("Mac")
    expect(defaultPasskeyName("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("Android phone")
    expect(defaultPasskeyName("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Windows PC")
    expect(defaultPasskeyName("curl/8")).toBe("This device")
  })
})

describe("sign-ins", () => {
  it("sends the zone, encoded", () => {
    expect(signInsQuery("Europe/Paris")).toBe("?zone=Europe%2FParis")
  })

  it("adds up the days and lists the newest first", () => {
    const days = [
      { date: "2026-11-01", ok: 1, failed: 0 },
      { date: "2026-11-16", ok: 2, failed: 1 },
      { date: "2026-11-10", ok: 0, failed: 3 },
    ]
    const summary = summarizeSignIns(days, 2)
    expect(summary.ok).toBe(3)
    expect(summary.failed).toBe(4)
    expect(summary.recent.map((d) => d.date)).toEqual(["2026-11-16", "2026-11-10"])
    expect(days[0].date).toBe("2026-11-01") // input left alone
  })
})

describe("tokenCheckFrom", () => {
  const verify = { email: "ana@example.com", purpose: "VERIFY" as const }

  it("accepts a token for this page's purpose", () => {
    expect(tokenCheckFrom(200, verify, "VERIFY")).toEqual({ kind: "ready", info: verify })
  })

  it("treats a token for the other purpose as invalid", () => {
    expect(tokenCheckFrom(200, verify, "RESET")).toEqual({ kind: "invalid" })
  })

  it("maps 410 and friends to invalid, anything else to error", () => {
    for (const status of [410, 404, 400]) expect(tokenCheckFrom(status, null, "RESET").kind).toBe("invalid")
    for (const status of [403, 500, 503]) expect(tokenCheckFrom(status, null, "RESET").kind).toBe("error")
  })

  it("reads only a single token param", () => {
    expect(tokenParam("abc")).toBe("abc")
    expect(tokenParam(["a", "b"])).toBe("")
    expect(tokenParam(undefined)).toBe("")
  })
})
