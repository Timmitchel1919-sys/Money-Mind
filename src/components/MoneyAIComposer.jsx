import { useEffect, useRef } from "react"
import { Mic, MicOff, Radio, Send, Settings, Square, Volume2, X } from "lucide-react"
import MoneyAIVoiceStatus from "./MoneyAIVoiceStatus"

const MAX_TEXTAREA_HEIGHT_PX = 200

const MODE_ICON = { off: MicOff, pushToTalk: Mic, continuous: Radio }

// ChatGPT-style unified input: multiline auto-resizing textarea, mic +
// voice-mode + mic-language controls on the left, send/stop on the right.
// Owns no state of its own beyond the textarea's auto-resize — everything
// else is lifted to the page so the existing voice hooks stay the single
// source of truth.
export default function MoneyAIComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isProcessing,
  recognition,
  onCancelRecording,
  voiceMode,
  onVoiceModeChange,
  voiceLanguage,
  onVoiceLanguageChange,
  synthesisStatus,
  synthesisSupported,
  onStopSpeech,
  onInterruptAndAsk,
  autoRead,
  onAutoReadChange,
  onOpenVoiceSettings,
  language = "en",
  t,
}) {
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`
  }, [value])

  const isListening = recognition.status === "listening"
  const isRecognitionBusy = recognition.status === "processing"
  const isSpeaking = synthesisStatus === "speaking"
  const micDisabled = !recognition.isSupported || isRecognitionBusy || isProcessing
  const showStatus = isListening || isRecognitionBusy || isSpeaking || isProcessing

  function handleMicClick() {
    if (isSpeaking) {
      onInterruptAndAsk()
    } else if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const MicIcon = isSpeaking ? Volume2 : isListening ? MicOff : Mic

  return (
    <div className="shrink-0 border-t border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {showStatus && (
          <div className="mb-3">
            <MoneyAIVoiceStatus
              mode={voiceMode}
              recognitionStatus={recognition.status}
              interimTranscript={recognition.interimTranscript}
              isProcessing={isProcessing}
              synthesisStatus={synthesisStatus}
              recognitionSupported={recognition.isSupported}
              synthesisSupported={synthesisSupported}
              language={language}
            />
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/40 p-2 focus-within:border-[var(--brand-primary)]/50">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full resize-none bg-transparent p-2 text-white outline-none placeholder:text-[#707680]"
              placeholder={t.placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label={t.placeholder}
            />

            {value && !isListening && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label={t.clearTranscript}
                title={t.clearTranscript}
                className="absolute right-1 top-1 rounded-full p-1 text-[#707680] transition hover:bg-white/5 hover:text-[#D5D8DD]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleMicClick}
                disabled={micDisabled}
                aria-label={
                  isSpeaking ? t.interruptAndAsk : isListening ? t.stopRecording : t.startRecording
                }
                title={isSpeaking ? t.interruptAndAsk : isListening ? t.stopRecording : t.startRecording}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-40 ${
                  isListening
                    ? "animate-pulse border-[#F87171]/50 bg-[#F87171]/15 text-[#F87171]"
                    : isSpeaking
                    ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]"
                    : "border-[#BFC4CC]/30 text-[#D5D8DD] hover:bg-white/5"
                }`}
              >
                <MicIcon size={16} />
              </button>

              {isListening && (
                <button
                  type="button"
                  onClick={onCancelRecording}
                  aria-label={t.cancel}
                  title={t.cancel}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#BFC4CC]/30 text-[#D5D8DD] transition hover:bg-white/5"
                >
                  <X size={14} />
                </button>
              )}

              {isSpeaking && (
                <button
                  type="button"
                  onClick={onStopSpeech}
                  aria-label={t.stopSpeech}
                  title={t.stopSpeech}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#BFC4CC]/30 text-[#D5D8DD] transition hover:bg-white/5"
                >
                  <Square size={14} />
                </button>
              )}

              <div className="flex items-center gap-1 rounded-full border border-[#BFC4CC]/20 bg-black/20 p-0.5" role="group" aria-label={t.voiceMode}>
                {["off", "pushToTalk", "continuous"].map((option) => {
                  const OptionIcon = MODE_ICON[option]
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onVoiceModeChange(option)}
                      disabled={option !== "off" && !recognition.isSupported}
                      aria-pressed={voiceMode === option}
                      aria-label={t.voiceModeLabels[option]}
                      title={t.voiceModeLabels[option]}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        voiceMode === option ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]" : "text-[#A5ADB8] hover:bg-white/5"
                      }`}
                    >
                      <OptionIcon size={13} />
                    </button>
                  )
                })}
              </div>

              <select
                className="rounded-full border border-[#BFC4CC]/20 bg-black/20 px-2 py-1.5 text-xs text-[#D5D8DD] outline-none"
                value={voiceLanguage}
                onChange={(e) => onVoiceLanguageChange(e.target.value)}
                aria-label={t.micLanguage}
                title={t.micLanguage}
              >
                <option value="en-US">EN</option>
                <option value="nl-NL">NL</option>
              </select>

              <button
                type="button"
                onClick={() => onAutoReadChange(!autoRead)}
                aria-pressed={autoRead}
                aria-label={t.autoRead}
                title={t.autoRead}
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                  autoRead ? "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]" : "border-[#BFC4CC]/20 text-[#A5ADB8] hover:bg-white/5"
                }`}
              >
                <Volume2 size={13} />
              </button>

              {onOpenVoiceSettings && (
                <button
                  type="button"
                  onClick={onOpenVoiceSettings}
                  aria-label={t.voiceSettings}
                  title={t.voiceSettings}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#A5ADB8] transition hover:bg-white/5"
                >
                  <Settings size={13} />
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label={t.stop}
                  title={t.stop}
                  className="flex items-center gap-2 rounded-xl border border-[#BFC4CC]/30 px-4 py-2 text-sm text-[#D5D8DD] transition hover:bg-white/5"
                >
                  <Square size={14} /> {t.stop}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!value.trim()}
                  aria-label={t.send}
                  title={t.send}
                  className="metallic-button flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={14} /> {t.send}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
