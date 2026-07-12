export default function SmallStat({ title, value }) {
  return (
    <div className="rounded-2xl border border-[#BFC4CC]/20 bg-black/30 p-4">
      <p className="text-sm text-[#A5ADB8]">{title}</p>
      <h3 className="mt-2 font-bold">{value}</h3>
    </div>
  )
}