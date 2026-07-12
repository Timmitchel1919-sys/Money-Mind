import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"

export default function DashboardLayout({
    user,
    profile,
    settings,
    handleLogout,
    activePage,
    setActivePage,
    children,
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    function handleNavigate(page) {
        setActivePage(page)
        setSidebarOpen(false)
    }

    // Escape closes the mobile drawer, same as clicking the backdrop.
    useEffect(() => {
        if (!isSidebarOpen) return
        function handleKeyDown(e) {
            if (e.key === "Escape") setSidebarOpen(false)
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isSidebarOpen])

    return (
        <div className="relative h-screen overflow-hidden p-4 text-[#FAFAFA] md:p-6">

            <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">

                <Sidebar
                    activePage={activePage}
                    setActivePage={handleNavigate}
                    handleLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Mobile-only backdrop behind the sidebar drawer — clicking it
                    closes the drawer, same as Escape or picking a nav item. */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Frozen Topbar + single scrollable content pane, at every
                    breakpoint: only this <main> scrolls. The Sidebar freezes
                    too — persistent column from md (tablet) up, and an
                    off-canvas drawer (opened via the Topbar's menu button)
                    below md, so it never has to share space with content on
                    a phone-width screen. */}
                <div className="flex h-full min-h-0 min-w-0 flex-col gap-6">

                    <Topbar
                        user={user}
                        profile={profile}
                        settings={settings}
                        onMenuClick={() => setSidebarOpen(true)}
                    />

                    <main className="scrollbar-transparent min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto pr-1">
                        {children}
                    </main>

                </div>

            </div>

        </div>
    )
}
