"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function SearchPage() {
  const [query, setQuery] = useState("")

  return (
    <div className="flex h-full flex-col items-center px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Search</h1>

      <div className="w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks, projects, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mt-12 flex flex-col items-center text-center">
          <Search className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold text-muted-foreground">Search your workspace</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find tasks, projects, and conversations quickly
          </p>
        </div>
      </div>
    </div>
  )
}
