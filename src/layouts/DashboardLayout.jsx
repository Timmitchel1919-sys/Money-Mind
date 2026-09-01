import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import MoneyAIWidget from "../components/MoneyAIWidget"

const SIDEBAR_STORAGE_KEY = "moneyMindSidebarState"

function initialSidebarState() {
    try { return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed" }
    catch { return false }
}

export default function DashboardLayout({
    profile,
    settings,
    handleLogout,
    activePage,
    setActivePage,
    moneyAIProps,
    children,
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false)
    const [isMoneyAIOpen, setMoneyAIOpen] = useState(false)
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(initialSidebarState)

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

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [isSidebarOpen])

    useEffect(() => {
        function syncSidebar(event) {
            if (event.key === SIDEBAR_STORAGE_KEY) setSidebarCollapsed(event.newValue === "collapsed")
        }
        window.addEventListener("storage", syncSidebar)
        return () => window.removeEventListener("storage", syncSidebar)
    }, [])

    function updateCollapsed(value) {
        setSidebarCollapsed(value)
        localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "collapsed" : "expanded")
    }

    return (
        <div className="relative h-dvh overflow-hidden text-[var(--text-primary)]">

                <Sidebar
                    activePage={activePage}
                    onNavigate={handleNavigate}
                    handleLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isMoneyAIOpen={isMoneyAIOpen}
                    onOpenMoneyAI={() => {
                        setMoneyAIOpen(true)
                        setSidebarOpen(false)
                    }}
                    collapsed={isSidebarCollapsed}
                    onCollapsedChange={updateCollapsed}
                    profile={profile}
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
                <div className={`flex h-dvh min-w-0 flex-col transition-[margin] duration-200 ${isSidebarCollapsed ? "md:ml-[76px]" : "md:ml-[272px]"}`}>

                    <div className="shrink-0 px-4 md:px-6">
                        <Topbar
                            settings={settings}
                            onNavigate={handleNavigate}
                            onMenuClick={() => setSidebarOpen(true)}
                            financialData={moneyAIProps}
                        />
                    </div>

                    <main className="scrollbar-transparent min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-8">{children}</div>
                    </main>

                </div>

            <MoneyAIWidget
                {...moneyAIProps}
                setActivePage={setActivePage}
                isOpen={isMoneyAIOpen}
                onOpenChange={setMoneyAIOpen}
            />

        </div>
    )
}
