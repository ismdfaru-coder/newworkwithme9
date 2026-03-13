"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Monitor,
  FileText,
  Presentation,
  Table,
  Search,
  GitBranch,
} from "lucide-react"

export type ActionType = "websites" | "docs" | "slides" | "sheets" | "deep-research" | "agent-swarm"

interface ChatActionButtonsProps {
  onAction: (action: ActionType) => void
  activeAction?: ActionType | null
  className?: string
}

const actions = [
  { type: "websites" as ActionType, label: "Websites", icon: Monitor },
  { type: "docs" as ActionType, label: "Docs", icon: FileText },
  { type: "slides" as ActionType, label: "Slides", icon: Presentation },
  { type: "sheets" as ActionType, label: "Sheets", icon: Table },
  { type: "deep-research" as ActionType, label: "Deep Research", icon: Search },
  { type: "agent-swarm" as ActionType, label: "Agent Swarm", icon: GitBranch, beta: true },
]

export function ChatActionButtons({ onAction, activeAction, className = "" }: ChatActionButtonsProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {actions.map((action) => (
        <Button
          key={action.type}
          variant="outline"
          size="sm"
          className={`gap-2 rounded-full border-border bg-background hover:bg-muted px-4 h-9 ${
            activeAction === action.type ? "border-primary bg-primary/10" : ""
          }`}
          onClick={() => onAction(action.type)}
        >
          <action.icon className="h-4 w-4" />
          <span>{action.label}</span>
          {action.beta && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Beta
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}
