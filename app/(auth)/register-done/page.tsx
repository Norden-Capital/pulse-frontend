import type { Metadata } from "next"
import { RegisterDone } from "./register-done"

export const metadata: Metadata = { title: "Check your inbox" }

export default function RegisterDonePage() {
  return <RegisterDone />
}
