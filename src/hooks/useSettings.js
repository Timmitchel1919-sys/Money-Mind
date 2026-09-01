import { useEffect, useState } from "react"
import { DEFAULT_BACKGROUND_THEME } from "../constants/backgroundThemes"

const STORAGE_KEY = "moneyMindSettings"

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  billDueReminders: true,
  negativeCashFlow: true,
  lowEmergencyFund: true,
  debtWarnings: true,
  savingsGoalUpdates: true,
  investmentPerformance: true,
  kpiWarnings: true,
  moneyAIInsights: true,
  billLeadTimeDays: 7,
}

export const DEFAULT_MONEY_AI_VOICE = {
  voiceModeEnabled: true,
  defaultMode: "pushToTalk", // "pushToTalk" | "continuous"
  wakePhraseEnabled: true,
  autoSubmitTranscript: true,
  autoReadAnswers: false,
  voiceLanguage: "auto", // "auto" | "en" | "nl"
  silenceTimeoutMs: 10000,
}

export const DEFAULT_SETTINGS = {
  currency: "SRD",
  language: "en",
  dateFormat: "weekday-long",
  timeFormat: "24h",
  numberFormat: "1,234.56",
  monthlyIncomeTarget: 9000,
  monthlySavingsTarget: 1500,
  emergencyFundMonths: 6,
  retirementAge: 40,
  themeMode: "system",
  backgroundTheme: DEFAULT_BACKGROUND_THEME,
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
  moneyAIVoice: DEFAULT_MONEY_AI_VOICE,
}

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return DEFAULT_SETTINGS

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notificationPreferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(parsed.notificationPreferences || {}),
      },
      moneyAIVoice: {
        ...DEFAULT_MONEY_AI_VOICE,
        ...(parsed.moneyAIVoice || {}),
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Settings live in local component state so edits only take effect once
// saveSettings() is called. Loaded from localStorage on mount, with a
// safe fallback to defaults if the stored value is missing or corrupted.
export default function useSettings() {
  const [settings, setSettings] = useState(loadStoredSettings)

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    if (key === "themeMode" || key === "currency" || key === "language") {
      try {
        const current = loadStoredSettings()
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [key]: value }))
      } catch { /* The in-memory preference still applies. */ }
    }
  }

  useEffect(() => {
    function syncSettings(event) {
      if (event.key === STORAGE_KEY) setSettings(loadStoredSettings())
    }
    window.addEventListener("storage", syncSettings)
    return () => window.removeEventListener("storage", syncSettings)
  }, [])

  function updateNotificationPreference(key, value) {
    setSettings((prev) => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, [key]: value },
    }))
  }

  function updateMoneyAIVoiceSetting(key, value) {
    setSettings((prev) => ({
      ...prev,
      moneyAIVoice: { ...prev.moneyAIVoice, [key]: value },
    }))
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
  }

  return {
    settings,
    updateSetting,
    updateNotificationPreference,
    updateMoneyAIVoiceSetting,
    saveSettings,
    resetSettings,
  }
}
