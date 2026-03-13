"use client"

import { useState } from "react"
import { Plus, ArrowUp, Presentation, Globe, Smartphone, Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const [inputValue, setInputValue] = useState("")

  const quickActions = [
    { icon: Presentation, label: "Create slides" },
    { icon: Globe, label: "Build website" },
    { icon: Smartphone, label: "Develop apps" },
    { icon: Paintbrush, label: "Design" },
  ]

  return (
    <section className="flex flex-col items-center justify-center px-4 py-24">
      <h1 className="mb-12 text-center text-4xl font-serif md:text-5xl lg:text-6xl">
        What can I do for you?
      </h1>

      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Assign a task or ask anything"
            className="min-h-[60px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            rows={2}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              disabled={!inputValue.trim()}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="gap-2 rounded-full"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
          <Button variant="outline" className="rounded-full">
            More
          </Button>
        </div>
      </div>
    </section>
  )
}
