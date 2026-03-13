"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SettingsModal } from "@/components/settings-modal"
import { SearchModal } from "@/components/search-modal"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("account")
  const [searchOpen, setSearchOpen] = useState(false)

  const openSettings = (tab: string = "account") => {
    setActiveSettingsTab(tab)
    setSettingsOpen(true)
  }

  // Determine header props based on current page
  const isAgentsPage = pathname === "/dashboard/agents"
  const headerTitle = isAgentsPage ? "Agents" : undefined
  const showVersionDropdown = !isAgentsPage

  return (
    <div className="flex h-screen bg-muted/30">
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onOpenSettings={openSettings}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          onOpenSettings={openSettings} 
          title={headerTitle}
          showVersionDropdown={showVersionDropdown}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        activeTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
      />
      <SearchModal 
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  )
}
