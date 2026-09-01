import { useEffect, useState } from "react"
import { Bell, Bot, Check, Monitor, Moon, Palette, ShieldCheck, SlidersHorizontal, Sun, User } from "lucide-react"
import Panel from "../components/Panel"
import Input from "../components/Input"
import Card from "../components/Card"
import RateStatus from "../components/RateStatus"
import AppLockSettings from "../components/AppLockSettings"
import { BACKGROUND_THEMES } from "../constants/backgroundThemes"
import { OPENAI_VOICES } from "../constants/openaiVoices"
import useFinancialNotifications from "../hooks/useFinancialNotifications"
import useSpeechSynthesis from "../hooks/useSpeechSynthesis"

const THEME_MODES = [
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
]

const SETTINGS_SECTIONS = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "profile", label: "Profile & Finance", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "Money AI", icon: Bot },
  { id: "security", label: "Security", icon: ShieldCheck },
]

const FINANCIAL_PERSONAS = [
  "Beginner",
  "Budget Builder",
  "Debt Reducer",
  "Saver",
  "Investor",
  "Entrepreneur",
  "Wealth Builder",
]

const NOTIFICATION_TOGGLES = [
  { key: "billDueReminders", label: "Bill due reminders", categories: ["Bills"] },
  { key: "negativeCashFlow", label: "Negative cash flow alerts", categories: ["Cash Flow"] },
  { key: "lowEmergencyFund", label: "Low emergency fund alerts", categories: ["Emergency Fund"] },
  { key: "debtWarnings", label: "Debt warnings", categories: ["Debt"] },
  { key: "savingsGoalUpdates", label: "Savings goal updates", categories: ["Savings", "Goals"] },
  { key: "investmentPerformance", label: "Investment performance alerts", categories: ["Investments"] },
  { key: "kpiWarnings", label: "KPI warnings", categories: [] },
  { key: "moneyAIInsights", label: "Money AI insights", categories: [] },
]

const SEVERITY_STYLES = {
  critical: { border: "border-[#F87171]/40", badge: "bg-[#F87171]/15 text-[#F87171]", label: "Critical" },
  high: { border: "border-[#FB923C]/40", badge: "bg-[#FB923C]/15 text-[#FB923C]", label: "High" },
  medium: { border: "border-[#FBBF24]/40", badge: "bg-[#FBBF24]/15 text-[#FBBF24]", label: "Medium" },
  positive: { border: "border-[#34D399]/40", badge: "bg-[#34D399]/15 text-[#34D399]", label: "Positive" },
  info: { border: "border-[#22D3EE]/40", badge: "bg-[#22D3EE]/15 text-[#22D3EE]", label: "Info" },
}

export default function Settings({
  user,
  profile,
  updateProfile,
  saveProfile,
  resetProfile,
  settings,
  updateSetting,
  updateNotificationPreference,
  updateMoneyAIVoiceSetting,
  saveSettings,
  resetSettings,
  transactions = [],
  bills = [],
  debts = [],
  goals = [],
  investments = [],
  emergencySavings = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  rateStatus,
  updatedAt,
  rateError,
  refreshRates,
  appLock,
}) {
  const [savedMessage, setSavedMessage] = useState("")
  const [profileSavedMessage, setProfileSavedMessage] = useState("")
  const [activeSection, setActiveSection] = useState(() => window.location.hash.split("/")[1] || "general")

  useEffect(() => {
    function syncSection() { setActiveSection(window.location.hash.split("/")[1] || "general") }
    window.addEventListener("hashchange", syncSection)
    window.addEventListener("popstate", syncSection)
    return () => { window.removeEventListener("hashchange", syncSection); window.removeEventListener("popstate", syncSection) }
  }, [])

  function selectSection(section) {
    window.history.pushState(null, "", `#settings/${section}`)
    setActiveSection(section)
  }

  const notificationPrefs = settings.notificationPreferences
  const voicePrefs = settings.moneyAIVoice
  const synthesis = useSpeechSynthesis()

  const notifications = useFinancialNotifications({
    transactions,
    bills,
    debts,
    goals,
    investments,
    emergencySavings,
    monthlyExpenses,
    monthlyIncome,
    billLeadTimeDays: notificationPrefs.billLeadTimeDays,
  })

  const enabledCategories = new Set(
    NOTIFICATION_TOGGLES.filter((toggle) => notificationPrefs[toggle.key]).flatMap((toggle) => toggle.categories)
  )

  const visibleNotifications = notifications.filter(
    (item) => enabledCategories.size === 0 || enabledCategories.has(item.category)
  )

  function handleSave() {
    saveSettings()
    setSavedMessage("Settings saved.")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  function handleReset() {
    resetSettings()
    setSavedMessage("Settings reset to defaults.")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  function handleSaveProfile() {
    saveProfile()
    setProfileSavedMessage("Profile saved.")
    setTimeout(() => setProfileSavedMessage(""), 3000)
  }

  function handleResetProfile() {
    resetProfile()
    setProfileSavedMessage("Profile reset to defaults.")
    setTimeout(() => setProfileSavedMessage(""), 3000)
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,860px)]">
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 lg:sticky lg:top-0" aria-label="Settings categories">
        <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">Settings</p>
        <nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">{SETTINGS_SECTIONS.map((section) => { const Icon = section.icon; const selected = activeSection === section.id; return <button key={section.id} type="button" onClick={() => selectSection(section.id)} aria-current={selected ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium transition lg:w-full ${selected ? "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:bg-white/5"}`}><Icon size={18} />{section.label}</button> })}</nav>
      </aside>
      <div className="min-w-0 space-y-6">
      {activeSection === "general" && <>
      <Panel
        title="General Preferences"
      >
        <p className="mt-2 text-[#A5ADB8]">
          Preferences are saved on this device. Account-wide sync is coming soon.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <SettingSelect
            label="Default Currency"
            value={settings.currency}
            onChange={(value) => updateSetting("currency", value)}
            options={[
              { value: "SRD", label: "SRD" },
              { value: "USD", label: "USD" },
              { value: "EUR", label: "EUR" },
            ]}
          />

          <SettingSelect
            label="Language"
            value={settings.language}
            onChange={(value) => updateSetting("language", value)}
            options={[
              { value: "en", label: "English" },
              { value: "nl", label: "Nederlands" },
              { value: "es", label: "Español" },
            ]}
          />

          <SettingSelect
            label="Number Format"
            value={settings.numberFormat}
            onChange={(value) => updateSetting("numberFormat", value)}
            options={[
              { value: "1,234.56", label: "1,234.56" },
              { value: "1.234,56", label: "1.234,56" },
            ]}
          />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm text-[#A5ADB8]">Exchange Rates</p>
          <RateStatus
            rateStatus={rateStatus}
            updatedAt={updatedAt}
            rateError={rateError}
            refreshRates={refreshRates}
          />
        </div>

        {settings.language !== "en" && (
          <p className="mt-6 rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4 text-sm text-[#A5ADB8]">
            Your language preference is saved. Full interface translation is still in
            development — Money Mind will keep rendering in English until it ships. Money AI
            already understands and replies in Dutch and English.
          </p>
        )}
      </Panel></>}

      {activeSection === "appearance" && <>
      <Panel title="Theme">
        <p className="mt-2 text-[#A5ADB8]">Choose the overall look of Money Mind.</p>

        <div className="mt-4 inline-flex rounded-2xl border border-[#BFC4CC]/25 bg-black/30 p-1">
          {THEME_MODES.map((mode) => {
            const isSelected = (settings.themeMode || "system") === mode.id
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => updateSetting("themeMode", mode.id)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? "bg-[#3aaf90] text-black"
                    : "text-[#D5D8DD] hover:bg-white/5"
                }`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {mode.label}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-[#A5ADB8]">
          Choose the ambient background (video or photo). It's used both here in the app and behind the
          login screen.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BACKGROUND_THEMES.map((theme) => {
            const isSelected = settings.backgroundTheme === theme.id

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateSetting("backgroundTheme", theme.id)}
                aria-pressed={isSelected}
                className={`group relative overflow-hidden rounded-2xl border p-1 text-left transition ${
                  isSelected ? "border-[#3aaf90]" : "border-[#BFC4CC]/25 hover:border-[#BFC4CC]/50"
                }`}
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  {theme.type === "image" ? (
                    <img className="h-full w-full object-cover" src={theme.src} alt="" aria-hidden="true" />
                  ) : (
                    <video
                      className="h-full w-full object-cover"
                      src={theme.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-hidden="true"
                    />
                  )}
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3aaf90] text-black">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-semibold text-[#FAFAFA]">{theme.label}</p>
                  <p className="mt-1 text-xs text-[#A5ADB8]">{theme.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-[#707680]">
          Want more options? Send over additional background videos or photos and they'll be added here.
        </p>
      </Panel></>}

      {activeSection === "security" && <>
      <Panel title="App Lock">
        <p className="mt-2 text-[#A5ADB8]">
          Require biometrics, a PIN, a password, or a pattern to open Money Mind, on top of your
          regular account sign-in.
        </p>

        <AppLockSettings appLock={appLock} displayName={profile.displayName} />
      </Panel></>}

      {activeSection === "profile" && <>
      <Panel title="Profile">
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            title="Account Email"
            value={
              <span className="block break-all text-lg leading-snug sm:text-xl">
                {user?.email || "N/A"}
              </span>
            }
          />
          <Card title="Financial Persona" value={profile.financialPersona} />
          <Card title="Country" value={profile.country || "Not set"} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-[#D5D8DD]">Email Address</label>
            <input
              className="w-full cursor-not-allowed rounded-xl border border-[#BFC4CC]/25 bg-black/20 p-3 text-[#A5ADB8] outline-none"
              type="email"
              value={user?.email || ""}
              readOnly
            />
          </div>

          <Input
            label="Display Name"
            placeholder="How should we address you?"
            value={profile.displayName}
            onChange={(value) => updateProfile("displayName", value)}
          />

          <Input label="Country" value={profile.country} onChange={(value) => updateProfile("country", value)} />

          <Input label="City" value={profile.city} onChange={(value) => updateProfile("city", value)} />

          <Input label="Occupation" value={profile.occupation} onChange={(value) => updateProfile("occupation", value)} />

          <div>
            <label className="mb-2 block text-sm text-[#D5D8DD]">Financial Persona</label>
            <select
              className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
              value={profile.financialPersona}
              onChange={(e) => updateProfile("financialPersona", e.target.value)}
            >
              {FINANCIAL_PERSONAS.map((persona) => (
                <option key={persona} value={persona}>
                  {persona}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#D5D8DD]">Preferred Currency</label>
            <select
              className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
              value={profile.preferredCurrency}
              onChange={(e) => updateProfile("preferredCurrency", e.target.value)}
            >
              <option value="SRD">SRD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm text-[#D5D8DD]">Financial Goal / Mission Statement</label>
          <textarea
            className="w-full resize-none rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
            rows={3}
            placeholder="e.g. Build a 6-month emergency fund and invest 20% of my income."
            value={profile.missionStatement}
            onChange={(e) => updateProfile("missionStatement", e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button onClick={handleSaveProfile} className="metallic-button rounded-xl px-6 py-3 font-semibold text-black">
            Save Profile
          </button>

          <button
            onClick={handleResetProfile}
            className="rounded-xl border border-[#BFC4CC]/30 px-6 py-3 font-semibold text-[#D5D8DD] hover:bg-white/5"
          >
            Reset Profile
          </button>

          {profileSavedMessage && <p className="text-sm text-[#34D399]">{profileSavedMessage}</p>}
        </div>

        <p className="mt-6 text-sm text-[#A5ADB8]">
          Profile details are saved on this device for now and will sync to your account once Firestore
          persistence is enabled for this module.
        </p>
      </Panel>

      <Panel title="Financial Preferences">
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Monthly Income Target"
            type="number"
            value={settings.monthlyIncomeTarget}
            onChange={(value) => updateSetting("monthlyIncomeTarget", Number(value))}
          />

          <Input
            label="Monthly Savings Target"
            type="number"
            value={settings.monthlySavingsTarget}
            onChange={(value) => updateSetting("monthlySavingsTarget", Number(value))}
          />

          <Input
            label="Emergency Fund Target (months)"
            type="number"
            value={settings.emergencyFundMonths}
            onChange={(value) => updateSetting("emergencyFundMonths", Number(value))}
          />

          <Input
            label="Retirement Age"
            type="number"
            value={settings.retirementAge}
            onChange={(value) => updateSetting("retirementAge", Number(value))}
          />
        </div>
      </Panel></>}

      {activeSection === "ai" && <>
      <Panel title="Money AI Voice">
        <p className="mt-2 text-[#A5ADB8]">
          Configure how Money AI listens and speaks in Push to Talk and Continuous Conversation modes.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ToggleField
            label="Voice mode enabled"
            checked={voicePrefs.voiceModeEnabled}
            onChange={(checked) => updateMoneyAIVoiceSetting("voiceModeEnabled", checked)}
          />

          <SettingSelect
            label="Default mode"
            value={voicePrefs.defaultMode}
            onChange={(value) => updateMoneyAIVoiceSetting("defaultMode", value)}
            options={[
              { value: "pushToTalk", label: "Push to Talk" },
              { value: "continuous", label: "Continuous Conversation" },
            ]}
          />

          <ToggleField
            label="Wake phrase required"
            checked={voicePrefs.wakePhraseEnabled}
            onChange={(checked) => updateMoneyAIVoiceSetting("wakePhraseEnabled", checked)}
          />

          <ToggleField
            label="Auto-submit transcript"
            checked={voicePrefs.autoSubmitTranscript}
            onChange={(checked) => updateMoneyAIVoiceSetting("autoSubmitTranscript", checked)}
          />

          <ToggleField
            label="Auto-read answers"
            checked={synthesis.prefs.autoRead}
            onChange={(checked) => synthesis.updatePref("autoRead", checked)}
          />

          <SettingSelect
            label="Voice engine"
            value={synthesis.prefs.engine}
            onChange={(value) => synthesis.updatePref("engine", value)}
            options={[
              { value: "browser", label: "Browser (free, device voices)" },
              { value: "openai", label: "OpenAI (premium, human-like)" },
            ]}
          />

          <SettingSelect
            label="Voice language"
            value={voicePrefs.voiceLanguage}
            onChange={(value) => updateMoneyAIVoiceSetting("voiceLanguage", value)}
            options={[
              { value: "auto", label: "Auto" },
              { value: "en", label: "English" },
              { value: "nl", label: "Nederlands" },
            ]}
          />

          <SettingSelect
            label="Silence timeout"
            value={String(voicePrefs.silenceTimeoutMs)}
            onChange={(value) => updateMoneyAIVoiceSetting("silenceTimeoutMs", Number(value))}
            options={[
              { value: "8000", label: "8 seconds" },
              { value: "10000", label: "10 seconds" },
              { value: "12000", label: "12 seconds" },
            ]}
          />
        </div>

        {synthesis.prefs.engine === "openai" ? (
          <div className="mt-6">
            <label className="mb-2 block text-sm text-[#D5D8DD]">Voice</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {OPENAI_VOICES.map((voice) => {
                const selected = synthesis.prefs.openaiVoice === voice.id
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => synthesis.updatePref("openaiVoice", voice.id)}
                    className={`flex items-center justify-between gap-2 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[#3aaf90] bg-[#3aaf90]/10"
                        : "border-[#BFC4CC]/20 bg-black/30 hover:border-[#BFC4CC]/40"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[#FAFAFA]">{voice.label}</span>
                      <span className="block text-xs text-[#A5ADB8]">{voice.description}</span>
                    </span>
                    {selected && <Check size={18} className="shrink-0 text-[#3aaf90]" />}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => synthesis.speak("Hi, this is a preview of the Money AI voice.", "en")}
              disabled={synthesis.status === "speaking"}
              className="metallic-button mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
            >
              {synthesis.status === "speaking" ? "Playing…" : "Test voice"}
            </button>

            {synthesis.error && <p className="mt-3 text-sm text-red-400">{synthesis.error}</p>}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#A5ADB8]">Speech rate: {synthesis.prefs.rate.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={synthesis.prefs.rate}
                  onChange={(e) => synthesis.updatePref("rate", Number(e.target.value))}
                  className="w-full accent-[#3aaf90]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#A5ADB8]">Volume: {Math.round(synthesis.prefs.volume * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={synthesis.prefs.volume}
                  onChange={(e) => synthesis.updatePref("volume", Number(e.target.value))}
                  className="w-full accent-[#3aaf90]"
                />
              </div>
            </div>

            <p className="mt-6 text-xs text-[#A5ADB8]">
              OpenAI voices are generated server-side (your API key never reaches the browser) and cost a small
              amount per reply spoken. Requires the moneyAIVoiceSynthesize Cloud Function to be deployed.
            </p>
          </div>
        ) : (
          synthesis.isSupported && (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#D5D8DD]">Preferred English voice</label>
                  <select
                    className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
                    value={synthesis.prefs.voiceURIByLang.en || ""}
                    onChange={(e) => synthesis.updateVoiceForLanguage("en", e.target.value)}
                  >
                    <option value="">Automatic</option>
                    {synthesis.voices
                      .filter((voice) => voice.lang?.toLowerCase().startsWith("en"))
                      .map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#D5D8DD]">Preferred Dutch voice</label>
                  <select
                    className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
                    value={synthesis.prefs.voiceURIByLang.nl || ""}
                    onChange={(e) => synthesis.updateVoiceForLanguage("nl", e.target.value)}
                  >
                    <option value="">Automatic</option>
                    {synthesis.voices
                      .filter((voice) => voice.lang?.toLowerCase().startsWith("nl"))
                      .map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-[#A5ADB8]">Speech rate: {synthesis.prefs.rate.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.05"
                    value={synthesis.prefs.rate}
                    onChange={(e) => synthesis.updatePref("rate", Number(e.target.value))}
                    className="w-full accent-[#3aaf90]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[#A5ADB8]">Pitch: {synthesis.prefs.pitch.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={synthesis.prefs.pitch}
                    onChange={(e) => synthesis.updatePref("pitch", Number(e.target.value))}
                    className="w-full accent-[#3aaf90]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[#A5ADB8]">Volume: {Math.round(synthesis.prefs.volume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={synthesis.prefs.volume}
                    onChange={(e) => synthesis.updatePref("volume", Number(e.target.value))}
                    className="w-full accent-[#3aaf90]"
                  />
                </div>
              </div>
            </>
          )
        )}

        <p className="mt-6 text-xs text-[#A5ADB8]">
          Voice recognition uses your browser's speech services. Availability and processing behavior depend on
          your browser and operating system. Money Mind does not intentionally save raw microphone audio.
        </p>
      </Panel></>}

      {activeSection === "notifications" && <>
      <Panel title="Notification Preferences">
        <p className="mt-2 text-[#A5ADB8]">
          Choose which alerts Money Mind should surface. Disabled categories are hidden from the
          live alerts list below.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {NOTIFICATION_TOGGLES.map((toggle) => (
            <ToggleField
              key={toggle.key}
              label={toggle.label}
              checked={Boolean(notificationPrefs[toggle.key])}
              onChange={(checked) => updateNotificationPreference(toggle.key, checked)}
            />
          ))}
        </div>

        <div className="mt-4 max-w-xs">
          <SettingSelect
            label="Bill due lead time"
            value={String(notificationPrefs.billLeadTimeDays)}
            onChange={(value) => updateNotificationPreference("billLeadTimeDays", Number(value))}
            options={[
              { value: "1", label: "1 day" },
              { value: "3", label: "3 days" },
              { value: "7", label: "7 days" },
              { value: "14", label: "14 days" },
            ]}
          />
        </div>

        <div className="mt-6 space-y-3">
          {visibleNotifications.length === 0 ? (
            <p className="text-[#A5ADB8]">No active alerts for your enabled notification types.</p>
          ) : (
            visibleNotifications.map((item) => {
              const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info
              return (
                <div key={item.id} className={`rounded-2xl border ${style.border} bg-black/30 p-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A5ADB8]">{item.category}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#A5ADB8]">{item.message}</p>
                </div>
              )
            })
          )}
        </div>
      </Panel></>}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={handleSave} className="metallic-button rounded-xl px-6 py-3 font-semibold text-black">
          Save Settings
        </button>

        <button
          onClick={handleReset}
          className="rounded-xl border border-[#BFC4CC]/30 px-6 py-3 font-semibold text-[#D5D8DD] hover:bg-white/5"
        >
          Reset to Defaults
        </button>

        {savedMessage && <p className="text-sm text-[#34D399]">{savedMessage}</p>}
      </div></div>
    </div>
  )
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-black/10 p-4">
      <span className="text-sm text-[#D5D8DD]">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[var(--brand-primary)]" : "bg-white/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></span><input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  )
}

function SettingSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#D5D8DD]">{label}</label>
      <select
        className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
