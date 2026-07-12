export default function CoachInsightCard({ rank, title, detail }) {
  return (
    <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-sm font-bold text-[#8B5CF6]">
          {rank}
        </span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="mt-2 text-sm text-[#A5ADB8]">{detail}</p>
    </div>
  )
}
