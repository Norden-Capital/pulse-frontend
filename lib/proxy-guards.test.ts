import { describe, expect, it } from "vitest"

import {
  DEV_ORIGIN,
  clientIp,
  forwardableRequestHeaders,
  isSameOriginWrite,
  ownOrigins,
  requestIdOf,
  returnableResponseHeaders,
} from "./proxy-guards"

const SITE = "https://pulse.example"
const ORIGINS = [SITE]

const headers = (values: Record<string, string>) => new Headers(values)

describe("isSameOriginWrite", () => {
  it("allows reads whatever their origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS", "get"]) {
      expect(isSameOriginWrite(method, headers({ origin: "https://evil.example" }), ORIGINS)).toBe(true)
    }
  })

  it("allows a write from the site itself", () => {
    const h = headers({ origin: SITE, "sec-fetch-site": "same-origin" })
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(isSameOriginWrite(method, h, ORIGINS)).toBe(true)
    }
  })

  it("refuses a write from another site", () => {
    expect(isSameOriginWrite("POST", headers({ origin: "https://evil.example" }), ORIGINS)).toBe(false)
    expect(isSameOriginWrite("DELETE", headers({ origin: "https://evil.example" }), ORIGINS)).toBe(false)
  })

  it("refuses a sibling subdomain and other schemes or ports of the same host", () => {
    for (const origin of ["https://api.pulse.example", "http://pulse.example", `${SITE}:8443`]) {
      expect(isSameOriginWrite("POST", headers({ origin }), ORIGINS), origin).toBe(false)
    }
  })

  it("refuses Origin: null", () => {
    expect(isSameOriginWrite("POST", headers({ origin: "null" }), ORIGINS)).toBe(false)
  })

  it("refuses by Sec-Fetch-Site when there is no Origin", () => {
    for (const site of ["cross-site", "same-site", "none"]) {
      expect(isSameOriginWrite("POST", headers({ "sec-fetch-site": site }), ORIGINS), site).toBe(false)
    }
    expect(isSameOriginWrite("POST", headers({ "sec-fetch-site": "same-origin" }), ORIGINS)).toBe(true)
  })

  it("refuses when Origin matches but Sec-Fetch-Site does not", () => {
    expect(isSameOriginWrite("POST", headers({ origin: SITE, "sec-fetch-site": "cross-site" }), ORIGINS)).toBe(false)
  })

  it("allows a write without either header (not a browser: curl, a script)", () => {
    expect(isSameOriginWrite("POST", headers({}), ORIGINS)).toBe(true)
  })
})

describe("ownOrigins", () => {
  it("uses the request URL and the forwarded host", () => {
    const h = headers({ host: "internal:3000", "x-forwarded-host": "pulse.example", "x-forwarded-proto": "https" })
    const origins = ownOrigins("http://internal:3000/api/ping", h, false)
    expect(origins).toContain(SITE)
    expect(origins).toContain("http://internal:3000")
    expect(origins).not.toContain(DEV_ORIGIN)
  })

  it("adds the dev server only in development", () => {
    expect(ownOrigins(`${SITE}/api/x`, headers({}), true)).toContain(DEV_ORIGIN)
    expect(ownOrigins(`${SITE}/api/x`, headers({}), false)).not.toContain(DEV_ORIGIN)
  })

  it("lets a deployment call itself but not another site", () => {
    const deployment = "https://pulse-frontend-git-x.vercel.app"
    const origins = ownOrigins(`${deployment}/api/ping`, headers({ host: "pulse-frontend-git-x.vercel.app" }), false)
    expect(isSameOriginWrite("POST", headers({ origin: deployment }), origins)).toBe(true)
    expect(isSameOriginWrite("POST", headers({ origin: SITE }), origins)).toBe(false)
  })
})

describe("clientIp", () => {
  it("takes x-real-ip, then the first x-forwarded-for, on Vercel", () => {
    expect(clientIp(headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" }), true)).toBe("203.0.113.7")
    expect(clientIp(headers({ "x-forwarded-for": "2001:db8::1, 10.0.0.1" }), true)).toBe("2001:db8::1")
  })

  it("forwards nothing off Vercel, where those headers can be forged", () => {
    expect(clientIp(headers({ "x-real-ip": "203.0.113.7" }), false)).toBeNull()
  })

  it("forwards nothing that is not an address", () => {
    expect(clientIp(headers({ "x-real-ip": "<script>" }), true)).toBeNull()
    expect(clientIp(headers({ "x-real-ip": "1.2.3.4 5.6.7.8" }), true)).toBeNull()
    expect(clientIp(headers({}), true)).toBeNull()
  })
})

describe("requestIdOf", () => {
  it("keeps a safe incoming id", () => {
    expect(requestIdOf(headers({ "x-request-id": "abc-123" }))).toBe("abc-123")
  })

  it("replaces a missing or unsafe one", () => {
    for (const h of [headers({}), headers({ "x-request-id": "a b;<x>" }), headers({ "x-request-id": "x".repeat(65) })]) {
      expect(requestIdOf(h)).toMatch(/^[0-9a-f-]{36}$/)
    }
  })
})

describe("forwardableRequestHeaders", () => {
  it("drops a caller's secret, addresses, origin, hop-by-hop and platform headers", () => {
    const out = forwardableRequestHeaders(
      headers({
        "x-pulse-proxy-secret": "forged",
        "x-client-ip": "1.1.1.1",
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "1.1.1.1",
        forwarded: "for=1.1.1.1",
        origin: SITE,
        host: "pulse.example",
        connection: "keep-alive",
        "accept-encoding": "gzip",
        "x-vercel-oidc-token": "token",
        "x-request-id": "abc",
        accept: "application/json",
        "content-type": "application/json",
        cookie: "a=b",
      })
    )
    expect([...out.keys()].sort()).toEqual(["accept", "content-type", "cookie"])
  })
})

describe("returnableResponseHeaders", () => {
  it("drops encoding and length, keeps each cookie separate, adds no-store", () => {
    const upstream = new Headers()
    upstream.append("content-type", "application/json")
    upstream.append("content-encoding", "gzip")
    upstream.append("content-length", "10")
    upstream.append("set-cookie", "a=1; Path=/")
    upstream.append("set-cookie", "b=2; Path=/")
    const out = returnableResponseHeaders(upstream)
    expect(out.get("content-type")).toBe("application/json")
    expect(out.has("content-encoding")).toBe(false)
    expect(out.has("content-length")).toBe(false)
    expect(out.getSetCookie()).toEqual(["a=1; Path=/", "b=2; Path=/"])
    expect(out.get("cache-control")).toBe("no-store")
  })

  it("keeps the backend's own cache-control", () => {
    expect(returnableResponseHeaders(headers({ "cache-control": "private, max-age=60" })).get("cache-control")).toBe(
      "private, max-age=60"
    )
  })
})
