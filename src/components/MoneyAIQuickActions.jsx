const QUESTIONS = {
  en: [
    "What were my expenses this month?",
    "How can I improve my savings rate?",
    "Which debt should I prioritize?",
    "Is my emergency fund sufficient?",
    "How is my portfolio performing?",
    "Am I on track for retirement?",
  ],
  nl: [
    "Wat waren mijn uitgaven deze maand?",
    "Hoe kan ik mijn spaarpercentage verbeteren?",
    "Welke schuld moet ik eerst aflossen?",
    "Is mijn noodfonds voldoende?",
    "Hoe presteert mijn portefeuille?",
    "Ben ik op schema voor mijn pensioen?",
  ],
}

export default function MoneyAIQuickActions({ language = "en", onSelect }) {
  const questions = QUESTIONS[language] || QUESTIONS.en

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect?.(question)}
          className="rounded-full border border-[#BFC4CC]/30 px-4 py-2 text-sm text-[#D5D8DD] transition hover:bg-white/5"
        >
          {question}
        </button>
      ))}
    </div>
  )
}
