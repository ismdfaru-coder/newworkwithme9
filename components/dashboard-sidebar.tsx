"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  PenSquare,
  Bot,
  Search,
  Settings,
  LayoutGrid,
  Smartphone,
  Monitor,
  Copy,
} from "lucide-react"

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  onOpenSettings: (tab?: string) => void
  onOpenSearch?: () => void
}

export function DashboardSidebar({ collapsed, onToggle, onOpenSettings, onOpenSearch }: DashboardSidebarProps) {
  const pathname = usePathname()

  const mainNavItems = [
    { icon: PenSquare, label: "New Chat", href: "/dashboard", shortcut: null, action: null },
    { icon: Bot, label: "Agents", href: "/dashboard/agents", shortcut: null, action: null },
    { icon: Search, label: "Search", href: null, shortcut: "CtrlK", action: onOpenSearch },
  ]

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <WorkwithMeLogo />
            <span className="font-semibold">WorkwithMe</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <WorkwithMeLogo />
          </Link>
        )}
        {!collapsed && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onToggle}>
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-auto px-2 pt-2">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            
            // If item has action, render as button
            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    "text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.shortcut && (
                    <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                  )}
                </button>
              )
            }
            
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.shortcut && (
                  <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                )}
              </Link>
            )
          })}
        </div>


      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-2">
        <div className="flex items-center justify-between px-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenSettings("settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {!collapsed && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Monitor className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

function WorkwithMeLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3C10.5 3 9.5 4 9 5C8.5 4.5 7.5 4 6 4C4 4 2 5.5 2 8C2 11 5 14 9 17C10 17.7 11 18 12 18C13 18 14 17.7 15 17C19 14 22 11 22 8C22 5.5 20 4 18 4C16.5 4 15.5 4.5 15 5C14.5 4 13.5 3 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8C8 8 9 10 12 10C15 10 16 8 16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


