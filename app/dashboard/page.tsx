"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Plus,
  ArrowUp,
  Lightbulb,
  Globe,
  Brain,
  Smile,
  Mic,
  X,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  FileText,
  Code,
  Sparkles,
  Monitor,
  ChevronDown,
  ChevronUp,
  Zap,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MarkdownContent } from "@/components/markdown-content"
import { ChatActionButtons, type ActionType } from "@/components/chat-action-buttons"
import { DocViewer, DocWizard, type DocData } from "@/components/doc-viewer"
import { SlidesViewer, SlidesWizard, type Slide, type SlidesData } from "@/components/slides-viewer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  status?: "pending" | "processing" | "completed" | "error"
  taskId?: string
  taskUrl?: string
  steps?: TaskStep[]
  artifacts?: Artifact[]
  sources?: Source[]
}

interface TaskStep {
  id: string
  type: "thinking" | "searching" | "analyzing" | "writing" | "complete"
  description: string
  timestamp: Date
}

interface Artifact {
  id: string
  type: "document" | "code" | "website" | "file"
  title: string
  content?: string
  url?: string
}

interface Source {
  url: string
  title: string
  description?: string
  favicon?: string
}

interface ManusResponse {
  id?: string
  task_id?: string
  status?: string
  result?: string | object | Array<{ id?: string; status?: string; role?: string; type?: string; content?: string }>
  output?: string | object | Array<{ id?: string; status?: string; role?: string; type?: string; content?: string }>
  message?: string
  error?: string
  metadata?: {
    task_title?: string
    task_url?: string
  }
  steps?: Array<{
    type: string
    description: string
  }>
  artifacts?: Array<{
    type: string
    title: string
    content?: string | object
    url?: string
  }>
}

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState("")
  const [showToolsBar, setShowToolsBar] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false)
  const [activeSources, setActiveSources] = useState<Source[]>([])
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<"none" | "web" | "deep" | "think">("none")
  const [turboMode, setTurboMode] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [docWizardOpen, setDocWizardOpen] = useState(false)
  const [slidesWizardOpen, setSlidesWizardOpen] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState<DocData | null>(null)
  const [generatedSlides, setGeneratedSlides] = useState<SlidesData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setPlusMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return

    // Check if this is a new chat (no existing messages)
    const isNewChat = messages.length === 0

    // Determine if we should use Manus API based on:
    // 1. Search mode selected (web, deep, think)
    // 2. Keywords in the message
    // Otherwise use Keyplex (faster)
    const manusKeywords = ["deep research", "web research", "browse", "search the web", "look up", "find online", "search online"]
    const hasManusKeyword = manusKeywords.some(keyword => 
      inputValue.toLowerCase().includes(keyword)
    )
    // Only use Manus if mode is selected OR keyword is found
    const shouldUseManus = searchMode !== "none" || hasManusKeyword
    
    // Store current mode for status messages (don't reset it - keep for subsequent messages)
    const currentMode = searchMode

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "pending",
      steps: [
        {
          id: crypto.randomUUID(),
          type: "thinking",
          description: "Understanding your request...",
          timestamp: new Date(),
        }
      ]
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // TURBO MODE: Use Cerebras for ultra-fast inference
      if (turboMode) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                status: "processing",
                steps: [
                  ...(m.steps || []),
                  {
                    id: crypto.randomUUID(),
                    type: "searching",
                    description: "Turbo processing...",
                    timestamp: new Date(),
                  }
                ]
              }
            : m
        ))

        const response = await fetch("/api/cerebras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            prompt: userMessage.content,
            model: "llama3.1-8b"
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to get response from Cerebras")
        }

        const content = data.output || ""

        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                content,
                status: "complete",
                steps: [
                  ...(m.steps || []),
                  {
                    id: crypto.randomUUID(),
                    type: "complete",
                    description: `Turbo complete${data.time_info ? ` (${(data.time_info.total_time * 1000).toFixed(0)}ms)` : ""}`,
                    timestamp: new Date(),
                  }
                ]
              }
            : m
        ))
        
        setIsLoading(false)
        return
      }

      // Use Keyplex for normal messages without special modes/keywords (faster, synchronous)
      // Only use Manus when: user selects web/deep/think mode OR uses keywords like "deep research", "web research", etc.
      if (!shouldUseManus) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                status: "processing",
                steps: [
                  ...(m.steps || []),
                  {
                    id: crypto.randomUUID(),
                    type: "searching",
                    description: "Thinking...",
                    timestamp: new Date(),
                  }
                ]
              }
            : m
        ))

        const response = await fetch("/api/keyplex", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            prompt: userMessage.content,
            model: "openai/gpt-4o-mini"
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to get response from Keyplex")
        }

        const content = data.output || ""

        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                content,
                status: "complete",
                steps: [
                  ...(m.steps || []),
                  {
                    id: crypto.randomUUID(),
                    type: "complete",
                    description: "Response ready",
                    timestamp: new Date(),
                  }
                ]
              }
            : m
        ))
        
        setIsLoading(false)
        return
      }

      // Use Manus API (with web search capabilities)
      // Update to processing status with appropriate message
      const statusMessage = currentMode === "deep" 
        ? "Deep researching..." 
        : currentMode === "think" 
          ? "Thinking deeper..."
          : "Thinking and searching the web..."
      
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              status: "processing",
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "searching",
                  description: statusMessage,
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))

      // Step 1: Create task with source instruction appended
      const sourceInstruction = "\n\n[IMPORTANT: At the very end of your response, include a section titled '---SOURCES---' with a numbered list of all source URLs you referenced. Format each source as: 'NUMBER. TITLE | URL | BRIEF_DESCRIPTION'. This section will be parsed programmatically.]"
      
      const response = await fetch("/api/manus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: userMessage.content + sourceInstruction,
          taskMode: "chat"
        }),
      })

      const data: ManusResponse = await response.json()
      console.log("[v0] POST Response:", JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create task")
      }

      const taskId = data.task_id || data.id
      console.log("[v0] Extracted taskId:", taskId)
      
      if (!taskId) {
        throw new Error("No task ID received from API")
      }

      // Update status to show we're waiting for results
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              taskId,
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "analyzing",
                  description: "Processing your request...",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))

      // Step 2: Poll for task result using GET endpoint
      const pollForResult = async (): Promise<ManusResponse> => {
        const maxAttempts = 180 // 3 minutes max (180 * 1 second)
        let attempts = 0
        let isFirstPoll = true

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Poll every 1 second for faster response
          
          // Pass firstPoll=true on first request to add delay on server side
          const pollUrl = `/api/manus?taskId=${taskId}${isFirstPoll ? '&firstPoll=true' : ''}`
          console.log("[v0] Polling GET", pollUrl)
          const statusResponse = await fetch(pollUrl)
          const statusData: ManusResponse = await statusResponse.json()
          console.log("[v0] GET Response status:", statusData.status)
          console.log("[v0] GET Response keys:", Object.keys(statusData))
          
          isFirstPoll = false

          if (!statusResponse.ok) {
            throw new Error(statusData.error || "Failed to get task status")
          }

          const status = statusData.status?.toLowerCase()
          
          // Check if task is complete
          if (status === "completed" || status === "done" || status === "finished" || status === "success") {
            console.log("[v0] Task completed! Full response:", JSON.stringify(statusData, null, 2))
            return statusData
          }
          
          // Check if task failed
          if (status === "failed" || status === "error") {
            throw new Error(statusData.error || statusData.message || "Task failed")
          }

          attempts++
        }

        throw new Error("Task timed out")
      }

      const resultData = await pollForResult()
      
      console.log("[v0] Full API Response:", JSON.stringify(resultData, null, 2))

      // Process the final result - handle various response formats
      const extractContent = (data: ManusResponse): string => {
        console.log("[v0] Extracting content from:", Object.keys(data))
        
        // Check for result field
        if (data.result !== undefined && data.result !== null) {
          console.log("[v0] Found result field, type:", typeof data.result)
          if (typeof data.result === 'string') return data.result
          if (typeof data.result === 'object') {
            // Handle array of message objects
            if (Array.isArray(data.result)) {
              console.log("[v0] Result is array with", data.result.length, "items")
              // Try to find assistant messages with content
              const assistantContent = data.result
                .filter((item) => item.role === 'assistant' && item.content)
                .map((item) => item.content)
                .join('\n\n')
              if (assistantContent) return assistantContent
              
              // If no assistant messages, try all items with content
              const allContent = data.result
                .filter((item) => item.content)
                .map((item) => item.content)
                .join('\n\n')
              if (allContent) return allContent
            }
            // Handle single message object with various content fields
            const resultObj = data.result as Record<string, unknown>
            console.log("[v0] Result object keys:", Object.keys(resultObj))
            if (resultObj.content && typeof resultObj.content === 'string') return resultObj.content
            if (resultObj.text && typeof resultObj.text === 'string') return resultObj.text
            if (resultObj.message && typeof resultObj.message === 'string') return resultObj.message
            if (resultObj.data && typeof resultObj.data === 'string') return resultObj.data
            // Last resort - stringify the object but exclude metadata
            const { id, status, role, type, ...contentFields } = resultObj
            if (Object.keys(contentFields).length > 0) {
              return JSON.stringify(contentFields, null, 2)
            }
          }
        }
        
        // Helper to extract text from content array (Manus API format)
        const extractTextFromContent = (content: unknown): string => {
          if (typeof content === 'string') return content
          if (Array.isArray(content)) {
            // Handle array of content objects like [{type: "output_text", text: "..."}]
            return content
              .filter((c): c is { type?: string; text?: string } => typeof c === 'object' && c !== null)
              .map((c) => c.text || '')
              .filter(Boolean)
              .join('\n')
          }
          if (typeof content === 'object' && content !== null) {
            const obj = content as Record<string, unknown>
            if (typeof obj.text === 'string') return obj.text
            if (typeof obj.content === 'string') return obj.content
          }
          return ''
        }

        // Check for output field
        if (data.output !== undefined && data.output !== null) {
          console.log("[v0] Found output field, type:", typeof data.output)
          if (typeof data.output === 'string') return data.output
          if (typeof data.output === 'object') {
            if (Array.isArray(data.output)) {
              // First try assistant messages
              const assistantContent = data.output
                .filter((item) => item.role === 'assistant' && item.content)
                .map((item) => extractTextFromContent(item.content))
                .filter(Boolean)
                .join('\n\n')
              if (assistantContent) {
                console.log("[v0] Extracted assistant content:", assistantContent.substring(0, 100))
                return assistantContent
              }
              
              // Then try all items with content
              const allContent = data.output
                .filter((item) => item.content)
                .map((item) => extractTextFromContent(item.content))
                .filter(Boolean)
                .join('\n\n')
              if (allContent) {
                console.log("[v0] Extracted all content:", allContent.substring(0, 100))
                return allContent
              }
            }
            const outputObj = data.output as Record<string, unknown>
            if (outputObj.content) return extractTextFromContent(outputObj.content)
            if (outputObj.text && typeof outputObj.text === 'string') return outputObj.text
            if (outputObj.data && typeof outputObj.data === 'string') return outputObj.data
          }
        }
        
        // Fallback to message
        if (data.message && typeof data.message === 'string') return data.message
        
        // Ultimate fallback - return stringified data (excluding known metadata)
        const { id, task_id, status, steps, artifacts, error, ...remaining } = data
        if (Object.keys(remaining).length > 0) {
          console.log("[v0] Using fallback, remaining keys:", Object.keys(remaining))
          return JSON.stringify(remaining, null, 2)
        }
        
        return "No content received from API"
      }

      let responseContent = extractContent(resultData)
      console.log("[v0] Extracted content:", responseContent.substring(0, 200))
      
      // Parse sources from the response text (looking for ---SOURCES--- section)
      const parseSourcesFromText = (text: string): { cleanedText: string; sources: Source[] } => {
        const sources: Source[] = []
        let cleanedText = text
        
        // Look for various sources section patterns and strip them
        const sourcePatterns = [
          /---SOURCES---[\s\S]*$/i,
          /\n\s*#{1,3}\s*sources?\s*:?\s*\n[\s\S]*$/i,
          /\n\s*\*{0,2}sources?\*{0,2}\s*:?\s*\n[\s\S]*$/i,
          /\n\s*references?\s*:?\s*\n[\s\S]*$/i,
          /\n\s*source\s+urls?\s*:?\s*\n[\s\S]*$/i,
          /\n\s*cited\s+sources?\s*:?\s*\n[\s\S]*$/i,
        ]
        
        let sourcesSection = ''
        for (const pattern of sourcePatterns) {
          const match = text.match(pattern)
          if (match) {
            sourcesSection = match[0]
            cleanedText = text.replace(pattern, '').trim()
            break
          }
        }
        
        // If we found a sources section, parse it
        if (sourcesSection) {
          // Parse each source line (format: "NUMBER. TITLE | URL | DESCRIPTION")
          const sourceLines = sourcesSection.split('\n').filter(line => line.trim())
          sourceLines.forEach(line => {
            // Match pattern: 1. Title | https://url.com | Description
            const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(https?:\/\/[^\s|]+)\s*(?:\|\s*(.+))?$/i)
            if (match) {
              const [, title, url, description] = match
              try {
                const urlObj = new URL(url.trim())
                sources.push({
                  url: url.trim(),
                  title: title?.trim() || urlObj.hostname,
                  description: description?.trim(),
                  favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
                })
              } catch {
                // Invalid URL, skip
              }
            } else {
              // Try to extract just URLs from the line
              const urlMatch = line.match(/(https?:\/\/[^\s]+)/g)
              if (urlMatch) {
                urlMatch.forEach(url => {
                  try {
                    const urlObj = new URL(url.trim())
                    // Extract title from text before URL
                    const titleMatch = line.match(/^\d+\.\s*(.+?)(?:https?:\/\/)/i)
                    sources.push({
                      url: url.trim(),
                      title: titleMatch?.[1]?.trim() || urlObj.hostname,
                      favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
                    })
                  } catch {
                    // Invalid URL, skip
                  }
                })
              }
            }
          })
        }
        
        // Also extract any inline URLs and create sources from them if no ---SOURCES--- section
        if (sources.length === 0) {
          const urlRegex = /https?:\/\/[^\s\)>\]]+/g
          const urls = text.match(urlRegex) || []
          const seenUrls = new Set<string>()
          
          urls.forEach(url => {
            try {
              const cleanUrl = url.replace(/[.,;:!?]+$/, '') // Remove trailing punctuation
              if (!seenUrls.has(cleanUrl)) {
                seenUrls.add(cleanUrl)
                const urlObj = new URL(cleanUrl)
                sources.push({
                  url: cleanUrl,
                  title: urlObj.hostname.replace('www.', ''),
                  favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
                })
              }
            } catch {
              // Invalid URL, skip
            }
          })
        }
        
        console.log("[v0] Parsed sources from text:", sources.length)
        return { cleanedText, sources }
      }
      
      const { cleanedText, sources: parsedSources } = parseSourcesFromText(responseContent)
      responseContent = cleanedText
      
      // Resolve redirect URLs (like vertexaisearch.cloud.google.com) to get actual URLs
      let sources = parsedSources
      if (parsedSources.length > 0) {
        try {
          const urlsToResolve = parsedSources.map(s => s.url)
          const resolveResponse = await fetch('/api/resolve-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: urlsToResolve }),
          })
          
          if (resolveResponse.ok) {
            const { resolvedUrls } = await resolveResponse.json() as { 
              resolvedUrls: Array<{ original: string; resolved: string }> 
            }
            
            // Update sources with resolved URLs and filter out any remaining vertex/google redirect URLs
            sources = parsedSources.map(source => {
              const resolved = resolvedUrls.find(r => r.original === source.url)
              if (resolved && resolved.resolved !== source.url) {
                try {
                  const resolvedUrlObj = new URL(resolved.resolved)
                  return {
                    ...source,
                    url: resolved.resolved,
                    // Update favicon to use the resolved domain
                    favicon: `https://www.google.com/s2/favicons?domain=${resolvedUrlObj.hostname}&sz=32`,
                    // Keep original title but could update hostname display
                  }
                } catch {
                  return source
                }
              }
              return source
            }).filter(source => {
              // Filter out any URLs that still contain vertex.ai or google redirect patterns
              const url = source.url.toLowerCase()
              return !url.includes('vertexaisearch.cloud.google.com') && 
                     !url.includes('vertex.ai') &&
                     !url.includes('google.com/url')
            })
            console.log("[v0] Resolved and filtered sources URLs:", sources.map(s => s.url))
          }
        } catch (error) {
          console.error("[v0] Error resolving URLs:", error)
          // Keep original sources if resolution fails
        }
      }
      
      // Parse artifacts if present
      const artifacts: Artifact[] = (resultData.artifacts || []).map((a, i) => ({
        id: crypto.randomUUID(),
        type: a.type as Artifact["type"] || "document",
        title: a.title || `Artifact ${i + 1}`,
        content: typeof a.content === 'string' ? a.content : JSON.stringify(a.content),
        url: a.url,
      }))

      // Extract task URL from metadata
      const taskUrl = resultData.metadata?.task_url

      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              content: responseContent,
              status: "completed",
              taskId,
              taskUrl,
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "complete",
                  description: "Task completed successfully",
                  timestamp: new Date(),
                }
              ],
              artifacts: artifacts.length > 0 ? artifacts : undefined,
              sources: sources.length > 0 ? sources : undefined,
            }
          : m
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              content: errorMessage,
              status: "error",
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "complete",
                  description: "Task failed",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle action button clicks (kimi-style)
  const handleActionClick = (action: ActionType) => {
    setActiveAction(action === activeAction ? null : action)
    
    switch (action) {
      case "docs":
        setDocWizardOpen(true)
        break
      case "slides":
        setSlidesWizardOpen(true)
        break
      case "deep-research":
        setSearchMode("deep")
        textareaRef.current?.focus()
        break
      case "websites":
        setInputValue("Help me build a website for ")
        textareaRef.current?.focus()
        break
      case "sheets":
        setInputValue("Create a spreadsheet or data table for ")
        textareaRef.current?.focus()
        break
      case "agent-swarm":
        setInputValue("Use agent swarm to help me with ")
        textareaRef.current?.focus()
        break
    }
  }

  // Generate document (kimi-style)
  const handleGenerateDoc = async (data: { topic: string; audience: string; style: string }) => {
    setIsGeneratingDoc(true)
    setDocWizardOpen(false)
    
    try {
      const response = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to generate document")
      
      const docData = await response.json()
      setGeneratedDoc(docData)
      
      // Add message to chat
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Create a document about "${data.topic}"${data.audience ? ` for ${data.audience}` : ""}`,
        timestamp: new Date(),
      }
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I've created a professional document about "${data.topic}". You can view it below, copy sections, or download it as PDF or DOCX.`,
        timestamp: new Date(),
        status: "completed",
      }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])
    } catch (error) {
      console.error("Error generating document:", error)
    } finally {
      setIsGeneratingDoc(false)
    }
  }

  // Generate slides (kimi-style)
  const handleGenerateSlides = async (data: { topic: string; audience: string; slideCount: string; style: string }) => {
    setIsGeneratingSlides(true)
    setSlidesWizardOpen(false)
    
    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to generate slides")
      
      const slidesData = await response.json()
      
      const styleColors = {
        professional: { bg: "#1e293b", text: "#ffffff" },
        creative: { bg: "#7c3aed", text: "#ffffff" },
        minimal: { bg: "#ffffff", text: "#1e293b" },
        dark: { bg: "#0f172a", text: "#e2e8f0" },
      }
      const colors = styleColors[data.style as keyof typeof styleColors] || styleColors.professional
      
      const slides: Slide[] = slidesData.slides.map((slide: { title: string; content: string[] }) => ({
        id: crypto.randomUUID(),
        title: slide.title,
        content: slide.content,
        backgroundColor: colors.bg,
        textColor: colors.text,
      }))
      
      setGeneratedSlides({
        topic: data.topic,
        slides,
        style: data.style as SlidesData["style"],
      })
      
      // Add message to chat
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Create a ${data.slideCount}-slide presentation about "${data.topic}"${data.audience ? ` for ${data.audience}` : ""}`,
        timestamp: new Date(),
      }
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I've created a ${slides.length}-slide presentation about "${data.topic}". You can view it below, navigate through slides, present in fullscreen, or download it as PPTX.`,
        timestamp: new Date(),
        status: "completed",
      }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])
    } catch (error) {
      console.error("Error generating slides:", error)
    } finally {
      setIsGeneratingSlides(false)
    }
  }

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRetry = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === "user") {
        setInputValue(userMessage.content)
        setMessages(prev => prev.slice(0, messageIndex - 1))
      }
    }
  }

  const getStepIcon = (type: TaskStep["type"], isLast: boolean) => {
    if (!isLast || type === "complete") {
      switch (type) {
        case "thinking":
          return <Sparkles className="h-3 w-3 text-blue-500" />
        case "searching":
          return <Globe className="h-3 w-3 text-green-500" />
        case "analyzing":
          return <Code className="h-3 w-3 text-orange-500" />
        case "writing":
          return <FileText className="h-3 w-3 text-purple-500" />
        case "complete":
          return <Check className="h-3 w-3 text-green-500" />
        default:
          return <Sparkles className="h-3 w-3" />
      }
    }
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
  }

  const getArtifactIcon = (type: Artifact["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "code":
        return <Code className="h-4 w-4" />
      case "website":
        return <Globe className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Show chat view if there are messages
  if (messages.length > 0) {
    return (
      <>
      <div className="flex h-full flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {/* Processing Steps */}
                  {message.role === "assistant" && message.steps && message.status !== "completed" && message.status !== "error" && (
                    <div className="mb-3 space-y-2">
                      {message.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          {getStepIcon(step.type, index === (message.steps?.length || 0) - 1)}
                          <span>{step.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  {message.content && (
                    message.role === "assistant" && message.status !== "error" ? (
                      <MarkdownContent content={message.content} />
                    ) : (
                      <div className={cn(
                        "prose prose-sm dark:prose-invert max-w-none",
                        message.status === "error" && "text-destructive"
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )
                  )}

                  {/* Artifacts */}
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {message.artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {getArtifactIcon(artifact.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{artifact.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{artifact.type}</p>
                          </div>
                          {artifact.url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={artifact.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions for assistant messages */}
                  {message.role === "assistant" && message.status === "completed" && (
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(message.content, message.id)}
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleRetry(message.id)}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </Button>
                      </div>
                      
{/* Source favicons - click to open sources panel */}
                      {message.sources && message.sources.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveSources(message.sources || [])
                            setSourcePanelOpen(true)
                          }}
                          className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center -space-x-1.5">
                            {message.sources.slice(0, 4).map((source, idx) => (
                              <div 
                                key={idx}
                                className="h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden"
                              >
                                <img 
                                  src={source.favicon} 
                                  alt="" 
                                  className="h-3 w-3"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                    const parent = (e.target as HTMLImageElement).parentElement
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-[8px] font-bold text-muted-foreground">${source.title.charAt(0).toUpperCase()}</span>`
                                    }
                                  }}
                                />
                              </div>
                            ))}
                            {message.sources.length > 4 && (
                              <div className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center">
                                <span className="text-[8px] font-medium text-muted-foreground">+{message.sources.length - 4}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Error state */}
                  {message.status === "error" && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => handleRetry(message.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Try again
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500">
                    <span className="text-sm font-medium text-white">U</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up question..."
                className="min-h-[40px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
                rows={1}
                disabled={isLoading}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  {/* Plus menu with dropdown */}
                  <div className="relative" ref={plusMenuRef}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    {plusMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setPlusMenuOpen(false)
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span>Add photos</span>
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setSearchMode("web")
                            setPlusMenuOpen(false)
                            textareaRef.current?.focus()
                          }}
                        >
                          <Globe className="h-4 w-4" />
                          <span>Web search</span>
                          {searchMode === "web" && <Check className="h-3 w-3 ml-auto text-primary" />}
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setPlusMenuOpen(false)
                          }}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Study and learn</span>
                        </button>
                        
                        <div className="border-t border-border my-1" />
                        
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setSearchMode("deep")
                            setPlusMenuOpen(false)
                            textareaRef.current?.focus()
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Deep research</span>
                          {searchMode === "deep" && <Check className="h-3 w-3 ml-auto text-primary" />}
                        </button>
                        <button 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setSearchMode("think")
                            setPlusMenuOpen(false)
                            textareaRef.current?.focus()
                          }}
                        >
                          <Lightbulb className="h-4 w-4" />
                          <span>Think longer</span>
                          {searchMode === "think" && <Check className="h-3 w-3 ml-auto text-primary" />}
                        </button>
                        
                        <div className="border-t border-border my-1" />
                        
                        <button 
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left ${
                            turboMode ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" : "hover:bg-muted"
                          }`}
                          onClick={() => {
                            setTurboMode(!turboMode)
                            if (!turboMode) {
                              setSearchMode("none") // Clear other modes when enabling turbo
                            }
                            setPlusMenuOpen(false)
                            textareaRef.current?.focus()
                          }}
                        >
                          <Zap className={`h-4 w-4 ${turboMode ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          <span>Turbo mode</span>
                          {turboMode && <Check className="h-3 w-3 ml-auto text-yellow-500" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Show active mode indicator - persists until user closes it */}
                  {searchMode !== "none" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  <button
                  onClick={() => setSearchMode("none")}
                  className="flex items-center justify-center hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove mode"
                  >
                  <X className="h-3.5 w-3.5" />
                  </button>
                  {searchMode === "web" && <><Globe className="h-3.5 w-3.5" /><span>Web search</span></>}
                  {searchMode === "deep" && <><Sparkles className="h-3.5 w-3.5" /><span>Deep research</span></>}
                  {searchMode === "think" && <><Lightbulb className="h-3.5 w-3.5" /><span>Think longer</span></>}
                  </div>
                  )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                  <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-full",
                      inputValue.trim() && !isLoading
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                    disabled={!inputValue.trim() || isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

{/* Sources Slide-out Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out z-50",
          sourcePanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Sources</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setSourcePanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeSources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-border hover:border-foreground/20 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={source.favicon} 
                      alt="" 
                      className="h-5 w-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-sm font-bold text-muted-foreground">${source.title.charAt(0).toUpperCase()}</span>`
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <span className="truncate">{(() => {
                        try {
                          return new URL(source.url).hostname.replace('www.', '')
                        } catch {
                          return source.title
                        }
                      })()}</span>
                    </div>
                    <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {source.title}
                    </h3>
                    {source.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {source.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </a>
            ))}
            
            {activeSources.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sources available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay when panel is open */}
      {sourcePanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSourcePanelOpen(false)}
        />
      )}
      </>
    )
  }

  // Initial view with prompt
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      {/* Main Heading */}
      <h1 className="mb-12 text-center font-serif text-4xl md:text-5xl">
        What do you want to Know?
      </h1>

      {/* Input Area */}
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you Today."
            className="min-h-[60px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            rows={2}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              {/* Plus menu with dropdown */}
              <div className="relative" ref={plusMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {/* Dropdown Menu */}
                {plusMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-border bg-card shadow-lg py-1 z-50">
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setPlusMenuOpen(false)
                        // TODO: Implement file upload
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>Add photos</span>
                    </button>
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setSearchMode("web")
                        setPlusMenuOpen(false)
                        textareaRef.current?.focus()
                      }}
                    >
                      <Globe className="h-4 w-4" />
                      <span>Web search</span>
                      {searchMode === "web" && <Check className="h-3 w-3 ml-auto text-primary" />}
                    </button>
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setPlusMenuOpen(false)
                        // TODO: Implement study and learn
                      }}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Study and learn</span>
                    </button>
                    
                    <div className="border-t border-border my-1" />
                    
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setSearchMode("deep")
                        setPlusMenuOpen(false)
                        textareaRef.current?.focus()
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Deep research</span>
                      {searchMode === "deep" && <Check className="h-3 w-3 ml-auto text-primary" />}
                    </button>
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                      onClick={() => {
                        setSearchMode("think")
                        setPlusMenuOpen(false)
                        textareaRef.current?.focus()
                      }}
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span>Think longer</span>
                      {searchMode === "think" && <Check className="h-3 w-3 ml-auto text-primary" />}
                    </button>
                  </div>
                )}
              </div>
              
{/* Turbo Mode Toggle */}
                  <button
                  onClick={() => setTurboMode(!turboMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    turboMode 
                      ? "border-yellow-500 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30" 
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title="Turbo Mode - Ultra-fast responses powered by Cerebras"
                  >
                  <Zap className={`h-3.5 w-3.5 ${turboMode ? "fill-yellow-500" : ""}`} />
                  <span>Turbo</span>
                  </button>

                  {/* Show active mode indicator - persists until user closes it */}
                  {searchMode !== "none" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  <button
                  onClick={() => setSearchMode("none")}
                  className="flex items-center justify-center hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove mode"
                  >
                  <X className="h-3.5 w-3.5" />
                  </button>
                  {searchMode === "web" && <><Globe className="h-3.5 w-3.5" /><span>Web search</span></>}
                  {searchMode === "deep" && <><Sparkles className="h-3.5 w-3.5" /><span>Deep research</span></>}
                  {searchMode === "think" && <><Lightbulb className="h-3.5 w-3.5" /><span>Think longer</span></>}
                  </div>
                  )}
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                  <HandIcon />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <SettingsIcon />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full",
                  inputValue.trim() && !isLoading
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                disabled={!inputValue.trim() || isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons (Kimi-style) */}
        <ChatActionButtons 
          onAction={handleActionClick}
          activeAction={activeAction}
          className="mt-6"
        />

        {/* Tools Connection Bar */}
        {showToolsBar && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <ConnectIcon />
              <span className="text-sm text-muted-foreground">Connected tools</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ToolIcon type="chatgpt" />
                <ToolIcon type="gmail" />
                <ToolIcon type="sheets" />
                <ToolIcon type="slack" />
                <ToolIcon type="github" />
                <ToolIcon type="notion" />
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setShowToolsBar(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Document Wizard */}
      <DocWizard 
        isOpen={docWizardOpen}
        onClose={() => setDocWizardOpen(false)}
        onGenerate={handleGenerateDoc}
        isGenerating={isGeneratingDoc}
      />

      {/* Slides Wizard */}
      <SlidesWizard
        isOpen={slidesWizardOpen}
        onClose={() => setSlidesWizardOpen(false)}
        onGenerate={handleGenerateSlides}
        isGenerating={isGeneratingSlides}
      />

      {/* Generated Document Display */}
      {generatedDoc && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-xl">
          <DocViewer 
            doc={generatedDoc}
            onClose={() => setGeneratedDoc(null)}
          />
        </div>
      )}

      {/* Generated Slides Display */}
      {generatedSlides && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-xl">
          <SlidesViewer 
            data={generatedSlides}
            onClose={() => setGeneratedSlides(null)}
          />
        </div>
      )}
    </div>
  )
}

function HandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ConnectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function ToolIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    chatgpt: (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10a37f]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.1408 1.6465 4.4708 4.4708 0 0 1 .4246 3.0137zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
        </svg>
      </div>
    ),
    gmail: (
      <div className="flex h-5 w-5 items-center justify-center rounded text-red-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
        </svg>
      </div>
    ),
    sheets: (
      <div className="flex h-5 w-5 items-center justify-center rounded text-green-600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.385 1.848H4.615A2.769 2.769 0 0 0 1.846 4.62v14.77a2.769 2.769 0 0 0 2.769 2.769h14.77a2.769 2.769 0 0 0 2.769-2.769V4.62a2.769 2.769 0 0 0-2.769-2.77zM7.385 18.465H4.615v-2.77h2.77zm0-4.616H4.615v-2.77h2.77zm0-4.615H4.615v-2.77h2.77zm5.538 9.231H8.308v-2.77h4.615zm0-4.616H8.308v-2.77h4.615zm0-4.615H8.308v-2.77h4.615zm6.462 9.231h-4.616v-2.77h4.616zm0-4.616h-4.616v-2.77h4.616zm0-4.615h-4.616v-2.77h4.616z"/>
        </svg>
      </div>
    ),
    slack: (
      <div className="flex h-5 w-5 items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
          <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
          <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
          <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      </div>
    ),
    github: (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </div>
    ),
    notion: (
      <div className="flex h-5 w-5 items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.746c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
        </svg>
      </div>
    ),
  }
  return icons[type] || null
}
