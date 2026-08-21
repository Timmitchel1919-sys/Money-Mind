import { useEffect, useState } from "react"
import { Fingerprint, Lock } from "lucide-react"
import PinPad from "./PinPad"
import PatternLockPad from "./PatternLockPad"

const PIN_LENGTH = 6

const METHOD_LABEL = {
  biometric: "Unlock with biometrics",
  pin: "Enter your PIN",
  password: "Enter your password",
  pattern: "Draw your pattern",
}

// Full-screen local app-lock gate, shown on top of the authenticated app
// whenever useAppLock reports isLocked. Firebase Auth has already run by
// this point — this is only the device-level re-entry check, so it never
// touches auth state itself, only appLock.verify*/isLocked.
export default function AppLockScreen({ appLock, displayName, onForgot }) {
  const [pin, setPin] = useState("")
  const [password, setPassword] = useState("")
  const [pattern, setPattern] = useState([])
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (appLock.method === "biometric") {
      handleBiometric()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appLock.method])

  useEffect(() => {
    if (appLock.method === "pin" && pin.length === PIN_LENGTH) {
      handleVerify(pin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  async function handleBiometric() {
    setError("")
    setIsVerifying(true)
    const ok = await appLock.verifyBiometric()
    setIsVerifying(false)
    if (!ok) setError("Biometric verification failed or was cancelled.")
  }

  async function handleVerify(value) {
    setError("")
    setIsVerifying(true)
    const ok = await appLock.verify(value)
    setIsVerifying(false)
    if (!ok) {
      setError("That didn't match. Try again.")
      setPin("")
      setPassword("")
      setPattern([])
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-2xl">
      <div className="glass-login-card w-full max-w-sm rounded-3xl p-8 text-center">
        <div className="flex justify-center">
          <img src="/money-mind-logo 2.png" alt="Money Mind" className="money-mind-logo h-16 w-auto object-contain" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[#D5D8DD]">
          <Lock size={16} />
          <p className="text-sm">
            {displayName ? `Welcome back, ${displayName}` : "Money Mind is locked"}
          </p>
        </div>

        <p className="mt-1 text-lg font-semibold text-[#FAFAFA]">{METHOD_LABEL[appLock.method]}</p>

        <div className="mt-6">
          {appLock.method === "biometric" && (
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleBiometric}
                disabled={isVerifying}
                aria-label="Unlock with biometrics"
                className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Fingerprint size={36} />
              </button>
              <p className="text-sm text-[#A5ADB8]">
                {isVerifying ? "Waiting for biometric confirmation…" : "Tap to unlock"}
              </p>
            </div>
          )}

          {appLock.method === "pin" && (
            <PinPad value={pin} onChange={setPin} maxLength={PIN_LENGTH} label="App lock PIN" />
          )}

          {appLock.method === "password" && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleVerify(password)
              }}
              className="space-y-4"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                aria-label="App lock password"
                className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-center text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
              />
              <button
                type="submit"
                disabled={!password || isVerifying}
                className="metallic-button w-full rounded-xl p-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Unlock
              </button>
            </form>
          )}

          {appLock.method === "pattern" && (
            <div className="flex flex-col items-center gap-4">
              <PatternLockPad pattern={pattern} onChange={setPattern} />
              <button
                type="button"
                onClick={() => handleVerify(pattern)}
                disabled={pattern.length < 4 || isVerifying}
                className="metallic-button rounded-xl px-6 py-2.5 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Unlock
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#F87171]" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        {onForgot && (
          <button
            type="button"
            onClick={onForgot}
            className="mt-6 text-xs text-[#707680] underline-offset-2 transition hover:text-[#A5ADB8] hover:underline"
          >
            Forgot it? Log out and reset App Lock
          </button>
        )}
      </div>
    </div>
  )
}
