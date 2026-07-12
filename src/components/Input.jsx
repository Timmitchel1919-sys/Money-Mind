export default function Input({ label, type = "text", placeholder = "", value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-[#D5D8DD]">{label}</label>
      <input
        className="w-full rounded-xl border border-[#BFC4CC]/25 bg-black/35 p-3 text-white outline-none"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}