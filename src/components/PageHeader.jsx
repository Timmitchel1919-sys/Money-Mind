import pageInfo from "../constants/pageInfo"
import PageInfoButton from "./PageInfoButton"

// Page-level title + "+" info button, rendered at the top of each page's
// own content (rather than globally in the Topbar) so it stays anchored
// to whichever page it explains, wherever that page puts it.
export default function PageHeader({ pageKey }) {
  const info = pageInfo[pageKey]
  if (!info) return null

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold text-[#FAFAFA] md:text-3xl">{info.title}</h1>
      <PageInfoButton pageKey={pageKey} />
    </div>
  )
}
