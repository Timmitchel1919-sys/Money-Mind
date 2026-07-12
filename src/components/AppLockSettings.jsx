import { useEffect, useState } from "react"
import { Fingerprint, KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react"
import PinPad from "./PinPad"
import PatternLockPad from "./PatternLockPad"
import { isBiometricSupported } from "../services/biometricAuth"

const PIN_LENGTH = 6

const METHODS = [
  { id: "biometric", label: "Biometric", detail: "Face ID / Touch ID / Windows Hello / fingerprint", icon: Fingerprint },
  { id: "pin", label: "PIN", detail: `${PIN_LENGTH}-digit code`, icon: KeyRound },
  { id: "password", label: "Password", detail: "A separate app-lock password", icon: Lock },
  { id: "pattern", label: "Pattern", detail: "Tap dots in sequence", icon: ShieldCheck },
]

// Self-contained App Lock configuration UI for Settings. Unlike the rest
// of the Settings page, actions here take effect immediately (there's no
// "Save" step) — a half-configured lock sitting in unsaved draft state
// would be confusing for a security feature, so each setup flow commits
// itself the moment it succeeds.
export default function AppLockSettings({ appLock, displayName }) {
  const [selectedMethod, setSelectedMethod] = useState(appLock.method !== "none" ? appLock.method : "pin")
  const [biometricAvailable, setBiometricAvailable] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [pinStep, setPinStep] = useState("enter")
  const [pinFirst, setPinFirst] = useState("")
  const [pinValue, setPinValue] = useState("")

  const [passwordStep, setPasswordStep] = useState("enter")
  const [passwordFirst, setPasswordFirst] = useState("")
  const [passwordValue, setPasswordValue] = useState("")

  const [patternStep, setPatternStep] = useState("enter")
  const [patternFirst, setPatternFirst] = useState([])
  const [patternValue, setPatternValue] = useState([])

  const [biometricBusy, setBiometricBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    isBiometricSupported().then((supported) => {
      if (!cancelled) setBiometricAvailable(supported)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function resetSetupState() {
    setPinStep("enter")
    setPinFirst("")
    setPinValue("")
    setPasswordStep("enter")
    setPasswordFirst("")
    setPasswordValue("")
    setPatternStep("enter")
    setPatternFirst([])
    setPatternValue([])
    setError("")
  }

  function handleSelectMethod(id) {
    setSelectedMethod(id)
    setMessage("")
    resetSetupState()
  }

  useEffect(() => {
    if (pinValue.length !== PIN_LENGTH) return

    if (pinStep === "enter") {
      setPinFirst(pinValue)
      setPinValue("")
      setPinStep("confirm")
      return
    }

    if (pinValue === pinFirst) {
      appLock.setupPin(pinValue).then(() => {
        setMessage("PIN lock enabled.")
        resetSetupState()
      })
    } else {
      setError("PINs didn't match — try again.")
      setPinStep("enter")
      setPinFirst("")
      setPinValue("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinValue])

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!passwordValue) return

    if (passwordStep === "enter") {
      setPasswordFirst(passwordValue)
      setPasswordValue("")
      setPasswordStep("confirm")
      return
    }

    if (passwordValue === passwordFirst) {
      await appLock.setupPassword(passwordValue)
      setMessage("Password lock enabled.")
      resetSetupState()
    } else {
      setError("Passwords didn't match — try again.")
      setPasswordStep("enter")
      setPasswordFirst("")
      setPasswordValue("")
    }
  }

  async function handlePatternConfirm() {
    if (patternValue.length < 4) return

    if (patternStep === "enter") {
      setPatternFirst(patternValue)
      setPatternValue([])
      setPatternStep("confirm")
      return
    }

    const matches =
      patternValue.length === patternFirst.length && patternValue.every((dot, i) => dot === patternFirst[i])

    if (matches) {
      await appLock.setupPattern(patternValue)
      setMessage("Pattern lock enabled.")
      resetSetupState()
    } else {
      setError("Patterns didn't match — try again.")
      setPatternStep("enter")
      setPatternFirst([])
      setPatternValue([])
    }
  }

  async function handleBiometricSetup() {
    setError("")
    setBiometricBusy(true)
    try {
      await appLock.setupBiometric(displayName)
      setMessage("Biometric lock enabled.")
    } catch {
      setError("Biometric setup was cancelled or isn't available on this device.")
    } finally {
      setBiometricBusy(false)
    }
  }

  function handleDisable() {
    appLock.disableLock()
    setMessage("App Lock disabled.")
    resetSetupState()
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
        <div className="flex items-center gap-3">
          {appLock.isEnabled ? <Lock size={18} className="text-[#3aaf90]" /> : <Unlock size={18} className="text-[#A5ADB8]" />}
          <div>
            <p className="text-sm font-semibold text-[#FAFAFA]">
              {appLock.isEnabled
                ? `App Lock is on — ${METHODS.find((m) => m.id === appLock.method)?.label || appLock.method}`
                : "App Lock is off"}
            </p>
            <p className="text-xs text-[#A5ADB8]">
              When enabled, Money Mind asks you to unlock again the next time it's opened.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {appLock.isEnabled && (
            <button
              type="button"
              onClick={appLock.lockNow}
              className="rounded-xl border border-[#BFC4CC]/30 px-4 py-2 text-sm text-[#D5D8DD] transition hover:bg-white/5"
            >
              Lock now (test)
            </button>
          )}
          {appLock.isEnabled && (
            <button
              type="button"
              onClick={handleDisable}
              className="rounded-xl border border-[#F87171]/30 px-4 py-2 text-sm text-[#F87171] transition hover:bg-[#F87171]/10"
            >
              Disable
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METHODS.map((method) => {
          const Icon = method.icon
          const isActive = selectedMethod === method.id
          const isCurrentlyEnabled = appLock.method === method.id && appLock.isEnabled

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelectMethod(method.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                isActive ? "border-[#3aaf90]/60 bg-[#3aaf90]/10" : "border-[#BFC4CC]/20 hover:bg-white/5"
              }`}
            >
              <Icon size={20} className={isActive ? "text-[#3aaf90]" : "text-[#A5ADB8]"} />
              <span className="text-sm font-semibold text-[#FAFAFA]">{method.label}</span>
              <span className="text-xs text-[#A5ADB8]">{method.detail}</span>
              {isCurrentlyEnabled && <span className="text-xs font-semibold text-[#3aaf90]">Active</span>}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-6">
        {selectedMethod === "biometric" && (
          <div className="flex flex-col items-center gap-4 text-center">
            {biometricAvailable === false && (
              <p className="text-sm text-[#F87171]">
                This browser or device doesn't support a platform biometric authenticator (Face ID / Touch
                ID / Windows Hello / fingerprint).
              </p>
            )}
            {biometricAvailable !== false && (
              <>
                <p className="text-sm text-[#A5ADB8]">
                  Registers this device's biometric sensor as the app-lock method. Your fingerprint/face
                  data never leaves your device — Money Mind only receives a yes/no confirmation.
                </p>
                <button
                  type="button"
                  onClick={handleBiometricSetup}
                  disabled={biometricBusy || biometricAvailable === null}
                  className="metallic-button flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Fingerprint size={18} />
                  {biometricBusy ? "Waiting for device prompt…" : "Set up biometric unlock"}
                </button>
              </>
            )}
          </div>
        )}

        {selectedMethod === "pin" && (
          <div className="flex flex-col items-center gap-2">
            <p className="mb-2 text-sm text-[#A5ADB8]">
              {pinStep === "enter" ? `Choose a ${PIN_LENGTH}-digit PIN` : "Confirm your PIN"}
            </p>
            <PinPad value={pinValue} onChange={setPinValue} maxLength={PIN_LENGTH} label="App lock PIN setup" />
          </div>
        )}

        {selectedMethod === "password" && (
          <form onSubmit={handlePasswordSubmit} className="mx-auto max-w-xs space-y-4">
            <p className="text-center text-sm text-[#A5ADB8]">
              {passwordStep === "enter" ? "Choose an app-lock password" : "Confirm your password"}
            </p>
            <input
              type="password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              aria-label="App lock password"
              className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-center text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3aaf90]"
            />
            <button
              type="submit"
              disabled={!passwordValue}
              className="metallic-button w-full rounded-xl p-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {passwordStep === "enter" ? "Continue" : "Confirm"}
            </button>
          </form>
        )}

        {selectedMethod === "pattern" && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-[#A5ADB8]">
              {patternStep === "enter" ? "Draw a new pattern" : "Draw it again to confirm"}
            </p>
            <PatternLockPad pattern={patternValue} onChange={setPatternValue} />
            <button
              type="button"
              onClick={handlePatternConfirm}
              disabled={patternValue.length < 4}
              className="metallic-button rounded-xl px-6 py-2.5 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {patternStep === "enter" ? "Continue" : "Confirm"}
            </button>
          </div>
        )}
      </div>

      {message && <p className="text-sm text-[#34D399]">{message}</p>}
      {error && (
        <p className="text-sm text-[#F87171]" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-[#707680]">
        App Lock is a local, device-level gate on top of your Money Mind account — your account itself
        stays protected by your regular sign-in. If you forget your PIN, password, or pattern, use "Log
        out" from the lock screen to sign back in and reset it.
      </p>
    </div>
  )
}
