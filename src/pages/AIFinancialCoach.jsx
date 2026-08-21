import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import Panel from "../components/Panel"
import Card from "../components/Card"
import CoachInsightCard from "../components/CoachInsightCard"
import MoneyAIChatShell from "../components/MoneyAIChatShell"
import MoneyAIConversation from "../components/MoneyAIConversation"
import MoneyAIComposer from "../components/MoneyAIComposer"
import MoneyAIAvatar from "../components/MoneyAIAvatar"
import useSettings from "../hooks/useSettings"
import useMoneyAIContext from "../hooks/useMoneyAIContext"
import useMoneyAI from "../hooks/useMoneyAI"
import useFinancialCoach from "../hooks/useFinancialCoach"
import useSpeechSynthesis from "../hooks/useSpeechSynthesis"
import useVoiceConversation from "../hooks/useVoiceConversation"
import { getAIProviderStatus, isExternalAIEnabled } from "../services/aiService"
import { detectLanguage } from "../utils/financialQuestionParser"

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatCurrency(value) {
  return `SRD ${Number(value || 0).toFixed(2)}`
}

const UI_TEXT = {
  en: {
    title: "Money AI",
    subtitle: "Your intelligent financial planning and education assistant.",
    placeholder: "Ask about your income, expenses, net worth, debt, investments, or a financial topic...",
    send: "Send",
    stop: "Stop",
    clear: "Clear conversation",
    clearTranscript: "Clear text",
    cancel: "Cancel",
    languageLabel: "Response language",
    auto: "Auto",
    privacyLocal: "Local analysis — your data stays in this browser.",
    privacyExternal: "External AI enabled.",
    context: "Financial Context",
    plan: "Prioritized Coaching Plan",
    privacy: "Privacy",
    emptyConversation: "Ask a question about your finances, or pick one of the suggested questions below.",
    loadingHistory: "Loading your conversation…",
    thinking: "Money AI is thinking…",
    listening: "Listening…",
    noPriorities: "No urgent priorities right now — your core KPIs are within healthy ranges.",
    voiceHint: "Tip: tap the microphone in the composer to ask by voice.",
    jumpToLatest: "Jump to latest",
    interruptAndAsk: "Interrupt and Ask",
    stopRecording: "Stop recording",
    startRecording: "Start recording",
    stopSpeech: "Stop speech",
    voiceMode: "Voice mode",
    voiceModeLabels: { off: "Voice off", pushToTalk: "Push to Talk", continuous: "Continuous Conversation" },
    micLanguage: "Microphone language",
    autoRead: "Auto-read replies",
    voiceSettings: "Voice settings",
  },
  nl: {
    title: "Money AI",
    subtitle: "Jouw intelligente assistent voor financiële planning en educatie.",
    placeholder: "Vraag naar je inkomen, uitgaven, nettovermogen, schulden, beleggingen of een financieel onderwerp...",
    send: "Versturen",
    stop: "Stoppen",
    clear: "Gesprek wissen",
    clearTranscript: "Tekst wissen",
    cancel: "Annuleren",
    languageLabel: "Antwoordtaal",
    auto: "Automatisch",
    privacyLocal: "Lokale analyse — je gegevens blijven in deze browser.",
    privacyExternal: "Externe AI ingeschakeld.",
    context: "Financieel overzicht",
    plan: "Prioritaire acties",
    privacy: "Privacy",
    emptyConversation: "Stel een vraag over je financiën of kies een van de voorgestelde vragen hieronder.",
    loadingHistory: "Je gesprek wordt geladen…",
    thinking: "Money AI denkt na…",
    listening: "Luisteren…",
    noPriorities: "Geen urgente prioriteiten — je belangrijkste KPI's zijn gezond.",
    voiceHint: "Tip: tik op de microfoon in het invoerveld om iets in te spreken.",
    jumpToLatest: "Naar laatste bericht",
    interruptAndAsk: "Onderbreken en vragen",
    stopRecording: "Opname stoppen",
    startRecording: "Opname starten",
    stopSpeech: "Spraak stoppen",
    voiceMode: "Spraakmodus",
    voiceModeLabels: { off: "Spraak uit", pushToTalk: "Indrukken om te praten", continuous: "Doorlopend gesprek" },
    micLanguage: "Microfoontaal",
    autoRead: "Antwoorden automatisch voorlezen",
    voiceSettings: "Spraakinstellingen",
  },
}

// Function renamed to MoneyAI for clarity; the file path/import stays
// AIFinancialCoach.jsx so App.jsx's import statement never has to change.
export default function MoneyAI({
  userId,
  transactions = [],
  budgets = [],
  assets = [],
  liabilities = [],
  goals = [],
  debts = [],
  savingsPlans = [],
  bills = [],
  investments = [],
  emergencySavings = 0,
  monthlyExpenses = 0,
  monthlyIncome = 0,
  setActivePage,
}) {
  const { settings } = useSettings()
  const voiceSettings = settings.moneyAIVoice

  const [languagePref, setLanguagePref] = useState(
    () => localStorage.getItem("moneyAILanguagePref") || voiceSettings.voiceLanguage || "auto"
  )
  const [voiceLanguage, setVoiceLanguage] = useState(
    () => localStorage.getItem("moneyAIVoiceLanguage") || (settings.language === "nl" ? "nl-NL" : "en-US")
  )
  const [voiceMode, setVoiceMode] = useState("off") // never auto-activates the mic on mount
  const [question, setQuestion] = useState("")

  useEffect(() => {
    localStorage.setItem("moneyAILanguagePref", languagePref)
  }, [languagePref])

  useEffect(() => {
    localStorage.setItem("moneyAIVoiceLanguage", voiceLanguage)
  }, [voiceLanguage])

  const financialContext = useMoneyAIContext({
    transactions,
    budgets,
    assets,
    liabilities,
    goals,
    debts,
    savingsPlans,
    bills,
    investments,
    emergencySavings,
    monthlyExpenses,
    monthlyIncome,
    settings,
  })

  const { actions } = useFinancialCoach(financialContext.kpis)
  const synthesis = useSpeechSynthesis()
  const moneyAI = useMoneyAI(financialContext, languagePref, userId)

  const { recognition, interruptAndAsk } = useVoiceConversation({
    mode: voiceMode,
    setMode: setVoiceMode,
    voiceLanguage,
    wakePhraseEnabled: voiceSettings.wakePhraseEnabled,
    autoSubmit: voiceSettings.autoSubmitTranscript,
    silenceTimeoutMs: voiceSettings.silenceTimeoutMs,
    moneyAI,
    synthesis,
    onDictation: (text) => setQuestion(text),
  })

  // Live-preview the transcript in the textarea while the mic is active
  // (Off mode dictation and Push to Talk both benefit from seeing what
  // was heard before it's sent or edited).
  useEffect(() => {
    if (recognition.status === "listening") {
      setQuestion(recognition.interimTranscript || recognition.finalTranscript)
    }
  }, [recognition.interimTranscript, recognition.finalTranscript, recognition.status])

  const lastAssistant = [...moneyAI.messages].reverse().find((message) => message.role === "assistant")

  // Auto-read for typed/manually-sent questions in Off mode only —
  // Push to Talk and Continuous Conversation always speak their answers
  // via useVoiceConversation, independent of this toggle.
  useEffect(() => {
    if (voiceMode !== "off" || !synthesis.prefs.autoRead) return
    const last = [...moneyAI.messages].reverse().find((message) => message.role === "assistant")
    if (last) synthesis.speak(last.text, last.language)
  }, [moneyAI.messages.length, synthesis.prefs.autoRead, voiceMode])

  const displayLanguage = languagePref === "auto" ? detectLanguage(question || lastAssistant?.text || "") : languagePref
  const t = UI_TEXT[displayLanguage] || UI_TEXT.en

  function handleSend() {
    if (!question.trim()) return
    moneyAI.send(question)
    setQuestion("")
  }

  function handleQuickAction(selected) {
    moneyAI.send(selected)
    setQuestion("")
  }

  function handleCopy(text) {
    navigator.clipboard?.writeText(text)
  }

  function handleCancelRecording() {
    recognition.abort()
    setQuestion("")
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
      <MoneyAIChatShell>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MoneyAIAvatar size={40} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-[#FAFAFA]">{t.title}</h1>
              <p className="truncate text-xs text-[#A5ADB8]">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A5ADB8]">{getAIProviderStatus(displayLanguage)}</span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A5ADB8]">
              {displayLanguage === "nl" ? "Taal: Nederlands" : "Language: English"}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-[#A5ADB8]">
              {t.voiceModeLabels[voiceMode]}
            </span>

            <select
              className="rounded-full border border-[#BFC4CC]/25 bg-black/35 px-3 py-1.5 text-xs text-white outline-none"
              value={languagePref}
              onChange={(e) => setLanguagePref(e.target.value)}
              aria-label={t.languageLabel}
              title={t.languageLabel}
            >
              <option value="auto">{t.auto}</option>
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
            </select>

            <button
              type="button"
              onClick={moneyAI.clear}
              disabled={moneyAI.messages.length === 0}
              aria-label={t.clear}
              title={t.clear}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BFC4CC]/30 text-[#D5D8DD] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <MoneyAIConversation
          messages={moneyAI.messages}
          isProcessing={moneyAI.isProcessing}
          isLoadingHistory={moneyAI.isLoadingHistory}
          error={moneyAI.error}
          onCopy={handleCopy}
          onPlay={(text, lang) => synthesis.speak(text, lang)}
          onRetry={moneyAI.retryLast}
          onSuggestedQuestion={handleQuickAction}
          language={displayLanguage}
          t={t}
        />

        <MoneyAIComposer
          value={question}
          onChange={setQuestion}
          onSubmit={handleSend}
          onStop={moneyAI.stop}
          isProcessing={moneyAI.isProcessing}
          recognition={recognition}
          onCancelRecording={handleCancelRecording}
          voiceMode={voiceMode}
          onVoiceModeChange={setVoiceMode}
          voiceLanguage={voiceLanguage}
          onVoiceLanguageChange={setVoiceLanguage}
          synthesisStatus={synthesis.status}
          synthesisSupported={synthesis.isSupported}
          onStopSpeech={synthesis.stop}
          onInterruptAndAsk={interruptAndAsk}
          autoRead={synthesis.prefs.autoRead}
          onAutoReadChange={(checked) => synthesis.updatePref("autoRead", checked)}
          onOpenVoiceSettings={setActivePage ? () => setActivePage("settings") : undefined}
          language={displayLanguage}
          t={t}
        />
      </MoneyAIChatShell>

      <div className="min-w-0 space-y-6">
        <Panel title={t.context}>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card title={displayLanguage === "nl" ? "Totaal inkomen" : "Total Income"} value={formatCurrency(financialContext.kpis.totalIncome)} />
            <Card title={displayLanguage === "nl" ? "Totale uitgaven" : "Total Expenses"} value={formatCurrency(financialContext.kpis.totalExpenses)} />
            <Card title={displayLanguage === "nl" ? "Spaarpercentage" : "Savings Rate"} value={formatPercent(financialContext.kpis.savingsRate)} />
            <Card title={displayLanguage === "nl" ? "Cashflow" : "Cash Flow"} value={formatCurrency(financialContext.kpis.freeCashFlow)} />
            <Card title={displayLanguage === "nl" ? "Nettovermogen" : "Net Worth"} value={formatCurrency(financialContext.kpis.netWorth)} />
            <Card title={displayLanguage === "nl" ? "Schuld" : "Debt"} value={formatCurrency(financialContext.kpis.totalDebt)} />
            <Card
              title={displayLanguage === "nl" ? "Noodfonds" : "Emergency Coverage"}
              value={`${financialContext.kpis.emergencyFundCoverage.toFixed(1)} ${displayLanguage === "nl" ? "maanden" : "months"}`}
            />
            <Card title={displayLanguage === "nl" ? "Beleggingsrendement" : "Investment Return"} value={formatPercent(financialContext.kpis.investmentReturn)} />
            <Card
              title={displayLanguage === "nl" ? "Health score" : "Health Score"}
              value={`${Math.round(financialContext.kpis.healthScore)}/100`}
              subtitle={financialContext.kpis.healthClassification.label}
            />
          </div>
        </Panel>

        <Panel title={t.plan}>
          <div className="mt-4 space-y-3">
            {actions.length === 0 ? (
              <p className="text-[#A5ADB8]">{t.noPriorities}</p>
            ) : (
              actions.map((action, index) => (
                <CoachInsightCard key={action.key} rank={index + 1} title={action.title} detail={action.detail} />
              ))
            )}
          </div>
        </Panel>

        <Panel title={t.privacy}>
          <p className="mt-2 text-sm text-[#A5ADB8]">{isExternalAIEnabled() ? t.privacyExternal : t.privacyLocal}</p>
        </Panel>
      </div>
    </div>
  )
}
