"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, ScanFace, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, ApiError, errorMessage } from "@/lib/api"
import { PASSKEY_NAME_MAX, type Passkey } from "@/lib/auth-types"
import {
  credentialToJSON,
  defaultPasskeyName,
  isCancel,
  passkeyErrorText,
  passkeysSupported,
  toCreationOptions,
} from "@/lib/passkeys"
import { BIG, Field, Notice, PILL } from "@/components/auth/auth-ui"
import { LocalDate } from "./local-date"

type Message = { tone: "success" | "danger"; text: string }

/**
 * "Face ID & passkeys": the user's passkeys (Spine's section). The list comes
 * from the server (null = load failed). Adding needs a browser that can use
 * passkeys; renaming and removing always work.
 */
export function PasskeysSection({ passkeys }: { passkeys: Passkey[] | null }) {
  const router = useRouter()
  // null = still checking.
  const [supported, setSupported] = useState<boolean | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<Passkey | null>(null)
  const [removing, setRemoving] = useState<Passkey | null>(null)

  useEffect(() => {
    let alive = true
    void passkeysSupported().then((ok) => alive && setSupported(ok))
    return () => {
      alive = false
    }
  }, [])

  function done(text: string) {
    setMessage({ tone: "success", text })
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face ID &amp; passkeys</CardTitle>
        <CardDescription>Sign in without your password on these devices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message && <Notice tone={message.tone}>{message.text}</Notice>}

        {passkeys === null ? (
          <Notice tone="info">Your passkeys could not be loaded. Please try again later.</Notice>
        ) : passkeys.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">No passkeys yet.</p>
        ) : (
          <ul className="divide-y rounded-[16px] bg-muted">
            {passkeys.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2 pr-1 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{p.name}</span>
                    {p.current && <Badge variant="secondary">This session</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added <LocalDate iso={p.createdAt} /> · Last used{" "}
                    {p.lastUsedAt ? <LocalDate iso={p.lastUsedAt} withTime /> : "never"}
                  </p>
                </div>
                <Button variant="ghost" size="icon-lg" aria-label={`Rename ${p.name}`} onClick={() => setRenaming(p)}>
                  <Pencil aria-hidden />
                </Button>
                <Button variant="ghost" size="icon-lg" aria-label={`Remove ${p.name}`} onClick={() => setRemoving(p)}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {supported === true && (
          <Button
            className={BIG}
            onClick={() => {
              setMessage(null)
              setAdding(true)
            }}
          >
            <ScanFace aria-hidden />
            Add Face ID / passkey
          </Button>
        )}
        {supported === false && (
          <p className="text-xs text-muted-foreground">This browser can&apos;t add passkeys. Use your phone instead.</p>
        )}
      </CardContent>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Face ID / passkey</DialogTitle>
            <DialogDescription>Give it a name, then confirm with your face, finger or PIN.</DialogDescription>
          </DialogHeader>
          {adding && (
            <AddPasskeyForm
              onDone={(name) => {
                setAdding(false)
                done(`"${name}" is added.`)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename passkey</DialogTitle>
          </DialogHeader>
          {renaming && (
            <RenameForm
              key={renaming.id}
              passkey={renaming}
              onDone={(name) => {
                setRenaming(null)
                done(`Renamed to "${name}".`)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <RemoveDialog
        passkey={removing}
        onClose={() => setRemoving(null)}
        onRemoved={(name) => done(`"${name}" is removed. It can't be used to sign in anymore.`)}
        onError={(text) => {
          setMessage({ tone: "danger", text })
          router.refresh()
        }}
      />
    </Card>
  )
}

/**
 * Name, then Face ID. The options are loaded when the form opens, so the tap
 * on "Continue" starts Face ID right away (iPhone Safari only allows it
 * straight from a tap).
 */
function AddPasskeyForm({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState(() => defaultPasskeyName(navigator.userAgent, navigator.maxTouchPoints))
  const [options, setOptions] = useState<PublicKeyCredentialCreationOptions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function loadOptions() {
    setOptions(null)
    try {
      const json = await api<Record<string, unknown>>("/me/passkeys/register/options", { method: "POST" })
      setOptions(toCreationOptions(json))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  useEffect(() => {
    // Loading the options from the backend when the form opens is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOptions()
  }, [])

  const trimmed = name.trim()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!options || !trimmed) return
    setError(null)
    setPending(true)
    try {
      const credential = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential | null
      if (!credential) throw new DOMException("No credential", "NotAllowedError")
      await api("/me/passkeys/register", { method: "POST", body: { name: trimmed, credential: credentialToJSON(credential) } })
      onDone(trimmed)
    } catch (err) {
      setPending(false)
      // Closed Face ID: no error, just try again. A used challenge needs new options.
      if (!isCancel(err)) setError(err instanceof ApiError ? errorMessage(err) : passkeyErrorText(err))
      void loadOptions()
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Notice tone="danger">{error}</Notice>}
      <Field
        id="passkey-name"
        label="Name"
        maxLength={PASSKEY_NAME_MAX}
        autoComplete="off"
        placeholder="e.g. iPhone"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!trimmed ? "Enter a name." : undefined}
      />
      <Button type="submit" className={BIG} disabled={pending || !options || !trimmed}>
        <ScanFace aria-hidden />
        {pending ? "Waiting for Face ID…" : options ? "Continue" : "Getting ready…"}
      </Button>
    </form>
  )
}

function RenameForm({ passkey, onDone }: { passkey: Passkey; onDone: (name: string) => void }) {
  const [name, setName] = useState(passkey.name)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const trimmed = name.trim()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed) return
    setPending(true)
    setError(null)
    try {
      await api(`/me/passkeys/${encodeURIComponent(passkey.id)}`, { method: "PATCH", body: { name: trimmed } })
      onDone(trimmed)
    } catch (err) {
      setError(err instanceof ApiError && err.code === "validation_error" ? "Use 1–60 normal characters." : errorMessage(err))
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        id="passkey-rename"
        label="Name"
        maxLength={PASSKEY_NAME_MAX}
        autoComplete="off"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? (!trimmed ? "Enter a name." : undefined)}
      />
      <Button type="submit" className={BIG} disabled={pending || !trimmed}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}

function RemoveDialog({
  passkey,
  onClose,
  onRemoved,
  onError,
}: {
  passkey: Passkey | null
  onClose: () => void
  onRemoved: (name: string) => void
  onError: (text: string) => void
}) {
  const [pending, setPending] = useState(false)

  async function remove() {
    if (!passkey) return
    setPending(true)
    try {
      await api(`/me/passkeys/${encodeURIComponent(passkey.id)}`, { method: "DELETE" })
      onRemoved(passkey.name)
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setPending(false)
      onClose()
    }
  }

  return (
    <Dialog open={passkey !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove &ldquo;{passkey?.name}&rdquo;?</DialogTitle>
          <DialogDescription>You can&apos;t sign in with it anymore. Your password still works.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" className={PILL} onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" className={PILL} onClick={remove} disabled={pending}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
