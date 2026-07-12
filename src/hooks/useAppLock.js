import { useCallback, useEffect, useState } from "react"
import { generateSalt, hashSecret, secretMatches } from "../utils/appLockCrypto"
import { registerBiometricCredential, verifyBiometricCredential } from "../services/biometricAuth"

const STORAGE_KEY = "moneyMindAppLock"

const DEFAULT_CONFIG = {
  method: "none", // "none" | "biometric" | "pin" | "password" | "pattern"
  enabled: false,
  salt: null,
  hash: null, // pin/password/pattern
  biometricCredentialId: null,
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage unavailable — the lock simply won't persist across reloads
  }
}

// Local, device-level app-lock gate on top of Firebase Auth. Firebase Auth
// remains the real account security boundary; this is the "re-enter to
// keep using the app" layer, checked once per fresh load (or on demand
// via lockNow()), the same pattern most mobile banking apps use for a
// PIN/biometric re-entry screen after Face ID unlocks the phone itself.
export default function useAppLock() {
  const [config, setConfig] = useState(loadConfig)
  const [isLocked, setIsLocked] = useState(() => {
    const initial = loadConfig()
    return Boolean(initial.enabled && initial.method !== "none")
  })

  useEffect(() => {
    saveConfig(config)
  }, [config])

  const setupPin = useCallback(async (pin) => {
    const salt = generateSalt()
    const hash = await hashSecret(pin, salt)
    setConfig({ method: "pin", enabled: true, salt, hash, biometricCredentialId: null })
    setIsLocked(false)
  }, [])

  const setupPassword = useCallback(async (password) => {
    const salt = generateSalt()
    const hash = await hashSecret(password, salt)
    setConfig({ method: "password", enabled: true, salt, hash, biometricCredentialId: null })
    setIsLocked(false)
  }, [])

  const setupPattern = useCallback(async (pattern) => {
    const salt = generateSalt()
    const hash = await hashSecret(JSON.stringify(pattern), salt)
    setConfig({ method: "pattern", enabled: true, salt, hash, biometricCredentialId: null })
    setIsLocked(false)
  }, [])

  const setupBiometric = useCallback(async (userLabel) => {
    const credentialId = await registerBiometricCredential(userLabel)
    setConfig({ method: "biometric", enabled: true, salt: null, hash: null, biometricCredentialId: credentialId })
    setIsLocked(false)
  }, [])

  const verify = useCallback(
    async (input) => {
      if (config.method === "pattern") {
        const ok = await secretMatches(JSON.stringify(input), config.salt, config.hash)
        if (ok) setIsLocked(false)
        return ok
      }
      const ok = await secretMatches(input, config.salt, config.hash)
      if (ok) setIsLocked(false)
      return ok
    },
    [config]
  )

  const verifyBiometric = useCallback(async () => {
    if (config.method !== "biometric" || !config.biometricCredentialId) return false
    try {
      const ok = await verifyBiometricCredential(config.biometricCredentialId)
      if (ok) setIsLocked(false)
      return ok
    } catch {
      return false
    }
  }, [config])

  const disableLock = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setIsLocked(false)
  }, [])

  const lockNow = useCallback(() => {
    if (config.method !== "none" && config.enabled) setIsLocked(true)
  }, [config])

  return {
    method: config.method,
    isEnabled: config.enabled && config.method !== "none",
    isLocked,
    setupPin,
    setupPassword,
    setupPattern,
    setupBiometric,
    verify,
    verifyBiometric,
    disableLock,
    lockNow,
  }
}
