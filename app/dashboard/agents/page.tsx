"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  ArrowUp,
  Presentation, 
  Globe, 
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
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  Zap,
  Eye,
  Hand,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatActionButtons, type ActionType } from "@/components/chat-action-buttons"
import { DocViewer, DocWizard, type DocData } from "@/components/doc-viewer"
import { SlidesViewer, SlidesWizard, type SlidesData } from "@/components/slides-viewer"

interface Slide {
  id: string
  title: string
  content: string[]
  backgroundColor?: string
  textColor?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  status?: "pending" | "browsing" | "processing" | "completed" | "error"
  taskId?: string
  steps?: TaskStep[]
  artifacts?: Artifact[]
  slides?: Slide[]
}

interface TaskStep {
  id: string
  type: "thinking" | "browsing" | "searching" | "analyzing" | "writing" | "complete"
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

interface FirecrawlSession {
  id: string
  cdpUrl: string
  liveViewUrl: string
  interactiveLiveViewUrl: string
}

interface FirecrawlResponse {
  success?: boolean
  id?: string
  cdpUrl?: string
  liveViewUrl?: string
  interactiveLiveViewUrl?: string
  result?: string
  error?: string
  message?: string
}

export default function AgentsPage() {
  const [inputValue, setInputValue] = useState("")
  const [showToolsBar, setShowToolsBar] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [slideMode, setSlideMode] = useState<"idle" | "wizard" | "generating" | "viewing">("idle")
  const [slideWizardStep, setSlideWizardStep] = useState(0)
  const [slideDetails, setSlideDetails] = useState({ topic: "", audience: "", slideCount: "5", style: "professional" })
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [turboMode, setTurboMode] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [docWizardOpen, setDocWizardOpen] = useState(false)
  const [newSlidesWizardOpen, setNewSlidesWizardOpen] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isGeneratingNewSlides, setIsGeneratingNewSlides] = useState(false)
  const [generatedDocData, setGeneratedDocData] = useState<DocData | null>(null)
  const [generatedSlidesData, setGeneratedSlidesData] = useState<SlidesData | null>(null)
  
  // Firecrawl Browser Session State
  const [browserSession, setBrowserSession] = useState<FirecrawlSession | null>(null)
  const [showBrowserPanel, setShowBrowserPanel] = useState(false)
  const [isBrowserLoading, setIsBrowserLoading] = useState(false)
  const [browserResults, setBrowserResults] = useState<string[]>([])
  const [showWorkWithMeButton, setShowWorkWithMeButton] = useState(false)
  const [currentTask, setCurrentTask] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cleanup browser session on unmount
  useEffect(() => {
    return () => {
      if (browserSession?.id) {
        fetch("/api/firecrawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close", sessionId: browserSession.id }),
        }).catch(console.error)
      }
    }
  }, [browserSession])

  // Create Firecrawl browser session
  const createBrowserSession = useCallback(async () => {
    setIsBrowserLoading(true)
    try {
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })

      const data: FirecrawlResponse = await response.json()

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to create browser session")
      }

      const session: FirecrawlSession = {
        id: data.id,
        cdpUrl: data.cdpUrl || "",
        liveViewUrl: data.liveViewUrl || "",
        interactiveLiveViewUrl: data.interactiveLiveViewUrl || "",
      }

      setBrowserSession(session)
      setShowBrowserPanel(true)
      return session
    } catch (error) {
      console.error("Error creating browser session:", error)
      return null
    } finally {
      setIsBrowserLoading(false)
    }
  }, [])

  // Execute code in browser session using agent-browser (bash) commands
  const executeBrowserCode = useCallback(async (code: string, language: string = "bash") => {
    if (!browserSession?.id) return null

    try {
      console.log("[v0] Executing browser command:", code, "language:", language)
      const response = await fetch("/api/firecrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          sessionId: browserSession.id,
          code,
          language,
        }),
      })

      const data: FirecrawlResponse = await response.json()
      console.log("[v0] Browser execution result:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute code")
      }

      if (data.result) {
        setBrowserResults(prev => [...prev, data.result!])
      }

      return data
    } catch (error) {
      console.error("Error executing browser code:", error)
      return null
    }
  }, [browserSession])

  // Close browser session
  const closeBrowserSession = useCallback(async () => {
    if (!browserSession?.id) return

    try {
      await fetch("/api/firecrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", sessionId: browserSession.id }),
      })
    } catch (error) {
      console.error("Error closing browser session:", error)
    } finally {
      setBrowserSession(null)
      setShowBrowserPanel(false)
      setBrowserResults([])
    }
  }, [browserSession])

  // Handle "Work with me" button click
  const handleWorkWithMe = async () => {
    if (!currentTask.trim()) return

    setIsLoading(true)
    setShowWorkWithMeButton(false)

    // Create browser session first
    const session = await createBrowserSession()
    if (!session) {
      setIsLoading(false)
      return
    }

    const assistantMessageId = crypto.randomUUID()

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "browsing",
      steps: [
        {
          id: crypto.randomUUID(),
          type: "browsing",
          description: "Browser session started. Executing task...",
          timestamp: new Date(),
        }
      ]
    }

    setMessages(prev => prev.map(m => 
      m.role === "assistant" && m.content.includes("Work with me")
        ? assistantMessage
        : m
    ))

    // Generate agent-browser commands based on the task
    const commands = generateAgentBrowserCommands(currentTask)
    console.log("[v0] Generated commands:", commands)
    
    let allResults: string[] = []
    
    // Execute each command sequentially
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i]
      
      // Update status for each step
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "browsing",
                  description: `Step ${i + 1}/${commands.length}: ${cmd.description}`,
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))

      // Execute the command using agent-browser (bash)
      const result = await executeBrowserCode(cmd.code, "bash")
      
      if (result?.result) {
        allResults.push(result.result)
      }
      
      // Small delay between commands to let browser update
      if (i < commands.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update with final results
    const finalContent = allResults.length > 0 
      ? `Task completed! Here are the results:\n\n${allResults.join("\n\n")}`
      : "Task completed. Watch the browser panel to see what happened."

    setMessages(prev => prev.map(m => 
      m.id === assistantMessageId 
        ? { 
            ...m, 
            content: finalContent,
            status: "completed",
            steps: [
              ...(m.steps || []),
              {
                id: crypto.randomUUID(),
                type: "complete",
                description: "All browser tasks completed",
                timestamp: new Date(),
              }
            ]
          }
        : m
    ))

    setIsLoading(false)
    setCurrentTask("")
  }

  // Generate agent-browser commands based on task description
  // agent-browser is a CLI pre-installed in Firecrawl sandbox with 40+ commands
  const generateAgentBrowserCommands = (task: string): Array<{ code: string; description: string }> => {
    const taskLower = task.toLowerCase()
    
    // Extract URL if present
    const urlMatch = task.match(/https?:\/\/[^\s]+/i)
    const url = urlMatch ? urlMatch[0] : null

    // Search task - use Google
    if (taskLower.includes("search") || taskLower.includes("find") || taskLower.includes("look up") || taskLower.includes("google")) {
      const searchQuery = task
        .replace(/search|find|look up|for|on google|on the web|google/gi, "")
        .replace(/https?:\/\/[^\s]+/gi, "")
        .trim()
      
      return [
        { code: `agent-browser open "https://www.google.com/search?q=${encodeURIComponent(searchQuery)}"`, description: `Searching Google for "${searchQuery}"` },
        { code: `agent-browser snapshot`, description: "Taking snapshot of search results" },
        { code: `agent-browser scrape`, description: "Extracting search results" },
      ]
    }

    // Navigate and scrape a specific URL
    if (url || taskLower.includes("go to") || taskLower.includes("visit") || taskLower.includes("open") || taskLower.includes("navigate")) {
      const targetUrl = url || "https://www.example.com"
      return [
        { code: `agent-browser open "${targetUrl}"`, description: `Opening ${targetUrl}` },
        { code: `agent-browser snapshot`, description: "Taking snapshot of the page" },
        { code: `agent-browser scrape`, description: "Extracting page content" },
      ]
    }

    // Screenshot/capture task
    if (taskLower.includes("screenshot") || taskLower.includes("capture") || taskLower.includes("snapshot")) {
      const targetUrl = url || "https://www.example.com"
      return [
        { code: `agent-browser open "${targetUrl}"`, description: `Opening ${targetUrl}` },
        { code: `agent-browser snapshot`, description: "Capturing screenshot" },
      ]
    }

    // Fill form / interact
    if (taskLower.includes("fill") || taskLower.includes("type") || taskLower.includes("enter") || taskLower.includes("input")) {
      const targetUrl = url || "https://www.google.com"
      return [
        { code: `agent-browser open "${targetUrl}"`, description: `Opening ${targetUrl}` },
        { code: `agent-browser snapshot`, description: "Analyzing page elements" },
      ]
    }

    // Click something
    if (taskLower.includes("click") || taskLower.includes("press") || taskLower.includes("tap")) {
      const targetUrl = url || "https://www.example.com"
      return [
        { code: `agent-browser open "${targetUrl}"`, description: `Opening ${targetUrl}` },
        { code: `agent-browser snapshot`, description: "Analyzing clickable elements" },
      ]
    }

    // Scrape/extract data
    if (taskLower.includes("scrape") || taskLower.includes("extract") || taskLower.includes("get data") || taskLower.includes("crawl")) {
      const targetUrl = url || "https://www.example.com"
      return [
        { code: `agent-browser open "${targetUrl}"`, description: `Opening ${targetUrl}` },
        { code: `agent-browser scrape`, description: "Extracting all data from page" },
      ]
    }

    // Default: try to understand the task and execute sensibly
    // If there's a URL, navigate to it. Otherwise go to Google and search the task
    if (url) {
      return [
        { code: `agent-browser open "${url}"`, description: `Opening ${url}` },
        { code: `agent-browser snapshot`, description: "Taking snapshot" },
        { code: `agent-browser scrape`, description: "Extracting content" },
      ]
    } else {
      // No URL - search for the task on Google
      return [
        { code: `agent-browser open "https://www.google.com/search?q=${encodeURIComponent(task)}"`, description: `Searching for "${task}"` },
        { code: `agent-browser snapshot`, description: "Taking snapshot of results" },
        { code: `agent-browser scrape`, description: "Extracting search results" },
      ]
    }
  }

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return

    // Store the task and show "Work with me" button
    setCurrentTask(inputValue.trim())
    setShowWorkWithMeButton(true)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "I can help you with this task! Click \"Work with me\" to start a live browser session where you can watch me work in real-time.",
      timestamp: new Date(),
      status: "completed",
      steps: [
        {
          id: crypto.randomUUID(),
          type: "thinking",
          description: "Ready to start browser session",
          timestamp: new Date(),
        }
      ]
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputValue("")

    // If turbo mode is enabled, use Cerebras instead
    if (turboMode) {
      setShowWorkWithMeButton(false)
      setIsLoading(true)
      
      try {
        const response = await fetch("/api/cerebras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: inputValue.trim(),
            model: "llama3.1-8b"
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to get response from Cerebras")
        }

        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                content: data.output || "",
                status: "completed",
                steps: [
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred"
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: errorMessage, status: "error" }
            : m
        ))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
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

  // Handle action button clicks (kimi-style)
  const handleActionClick = (action: ActionType) => {
    setActiveAction(action === activeAction ? null : action)
    
    switch (action) {
      case "docs":
        setDocWizardOpen(true)
        break
      case "slides":
        setNewSlidesWizardOpen(true)
        break
      case "deep-research":
        setInputValue("Do deep research on ")
        textareaRef.current?.focus()
        break
      case "websites":
        setInputValue("Build a website for ")
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
      setGeneratedDocData(docData)
      
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
  const handleGenerateNewSlides = async (data: { topic: string; audience: string; slideCount: string; style: string }) => {
    setIsGeneratingNewSlides(true)
    setNewSlidesWizardOpen(false)
    
    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error("Failed to generate slides")
      
      const slidesResponse = await response.json()
      
      const styleColors = {
        professional: { bg: "#1e293b", text: "#ffffff" },
        creative: { bg: "#7c3aed", text: "#ffffff" },
        minimal: { bg: "#ffffff", text: "#1e293b" },
        dark: { bg: "#0f172a", text: "#e2e8f0" },
      }
      const colors = styleColors[data.style as keyof typeof styleColors] || styleColors.professional
      
      const slides: Slide[] = slidesResponse.slides.map((slide: { title: string; content: string[] }) => ({
        id: crypto.randomUUID(),
        title: slide.title,
        content: slide.content,
        backgroundColor: colors.bg,
        textColor: colors.text,
      }))
      
      setGeneratedSlidesData({
        topic: data.topic,
        slides,
        style: data.style as SlidesData["style"],
      })
      
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
      setIsGeneratingNewSlides(false)
    }
  }

  const generateSlides = async () => {
    setSlideMode("generating")
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `Create a ${slideDetails.slideCount}-slide presentation about "${slideDetails.topic}" for ${slideDetails.audience || "general audience"}. Style: ${slideDetails.style}.`,
      timestamp: new Date(),
    }

    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "pending",
      steps: [
        {
          id: crypto.randomUUID(),
          type: "searching",
          description: `Researching "${slideDetails.topic}"...`,
          timestamp: new Date(),
        }
      ]
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setIsLoading(true)

    // Update status to analyzing
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "analyzing",
                  description: "Analyzing key points and insights...",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))
    }, 1500)

    // Update status to writing
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "writing",
                  description: "Generating presentation slides...",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))
    }, 3000)

    try {
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: slideDetails.topic,
          audience: slideDetails.audience,
          slideCount: slideDetails.slideCount,
          style: slideDetails.style,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate slides')
      }

      const data = await response.json()
      
      const colors = {
        professional: { bg: "#1e293b", text: "#ffffff" },
        creative: { bg: "#7c3aed", text: "#ffffff" },
        minimal: { bg: "#ffffff", text: "#1e293b" },
        dark: { bg: "#0f172a", text: "#e2e8f0" },
      }
      const selectedColors = colors[slideDetails.style as keyof typeof colors] || colors.professional

      const slides: Slide[] = data.slides.map((slide: { title: string; content: string[] }) => ({
        id: crypto.randomUUID(),
        title: slide.title,
        content: slide.content,
        backgroundColor: selectedColors.bg,
        textColor: selectedColors.text,
      }))
      
      setGeneratedSlides(slides)
      setCurrentSlideIndex(0)
      
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              content: `I've researched "${slideDetails.topic}" and created a ${slides.length}-slide presentation with key insights and information. You can view it below, navigate through slides, present in fullscreen, or download it.`,
              status: "completed",
              slides: slides,
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "complete",
                  description: "Presentation created successfully",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))
      
      setSlideMode("viewing")
    } catch (error) {
      console.error('Error generating slides:', error)
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              content: "I encountered an error while generating the presentation. Please try again.",
              status: "error",
              steps: [
                ...(m.steps || []),
                {
                  id: crypto.randomUUID(),
                  type: "complete",
                  description: "Error generating presentation",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))
      setSlideMode("idle")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadSlides = async () => {
    const pptxgen = (await import('pptxgenjs')).default
    
    const pres = new pptxgen()
    pres.author = 'WorkwithMe AI'
    pres.title = slideDetails.topic
    pres.subject = `Presentation about ${slideDetails.topic}`
    
    const colorSchemes = {
      professional: { bg: '1e293b', title: 'FFFFFF', text: 'E2E8F0', accent: '3B82F6' },
      creative: { bg: '7c3aed', title: 'FFFFFF', text: 'E9D5FF', accent: 'F472B6' },
      minimal: { bg: 'FFFFFF', title: '1e293b', text: '475569', accent: '0EA5E9' },
      dark: { bg: '0f172a', title: 'F8FAFC', text: 'CBD5E1', accent: '22D3EE' },
    }
    const colors = colorSchemes[slideDetails.style as keyof typeof colorSchemes] || colorSchemes.professional

    generatedSlides.forEach((slide, index) => {
      const pptSlide = pres.addSlide()
      pptSlide.background = { color: colors.bg }
      
      if (index === 0) {
        pptSlide.addText(slide.title, {
          x: 0.5, y: '35%', w: '90%', h: 1.5,
          fontSize: 44, fontFace: 'Arial', color: colors.title, bold: true, align: 'center',
        })
        
        if (slide.content.length > 0) {
          pptSlide.addText(slide.content.join(' | '), {
            x: 0.5, y: '55%', w: '90%', h: 0.75,
            fontSize: 20, fontFace: 'Arial', color: colors.text, align: 'center',
          })
        }
        
        pptSlide.addShape('rect' as pptxgen.ShapeType, {
          x: '35%', y: '50%', w: '30%', h: 0.05, fill: { color: colors.accent },
        })
      } else if (index === generatedSlides.length - 1) {
        pptSlide.addText(slide.title, {
          x: 0.5, y: '40%', w: '90%', h: 1.5,
          fontSize: 48, fontFace: 'Arial', color: colors.title, bold: true, align: 'center',
        })
        
        if (slide.content.length > 0) {
          pptSlide.addText(slide.content.join('\n'), {
            x: 0.5, y: '55%', w: '90%', h: 1,
            fontSize: 18, fontFace: 'Arial', color: colors.text, align: 'center',
          })
        }
      } else {
        pptSlide.addText(slide.title, {
          x: 0.5, y: 0.5, w: '90%', h: 1,
          fontSize: 32, fontFace: 'Arial', color: colors.title, bold: true,
        })
        
        pptSlide.addShape('rect' as pptxgen.ShapeType, {
          x: 0.5, y: 1.4, w: 1.5, h: 0.05, fill: { color: colors.accent },
        })
        
        const bulletPoints = slide.content.map(item => ({
          text: item,
          options: { 
            bullet: { type: 'bullet' as const, color: colors.accent },
            color: colors.text, fontSize: 18, fontFace: 'Arial',
            paraSpaceBefore: 12, paraSpaceAfter: 6,
          }
        }))
        
        pptSlide.addText(bulletPoints, {
          x: 0.5, y: 1.8, w: '90%', h: 3.5, valign: 'top',
        })
      }
      
      if (index > 0) {
        pptSlide.addText(`${index + 1}`, {
          x: '90%', y: '92%', w: 0.5, h: 0.3,
          fontSize: 10, color: colors.text, align: 'right',
        })
      }
    })

    await pres.writeFile({ fileName: `${slideDetails.topic.replace(/[^a-z0-9]/gi, '_')}_presentation.pptx` })
  }

  const getStepIcon = (type: TaskStep["type"], isLast: boolean) => {
    if (!isLast || type === "complete") {
      switch (type) {
        case "thinking":
          return <Sparkles className="h-3 w-3 text-blue-500" />
        case "browsing":
          return <Monitor className="h-3 w-3 text-cyan-500" />
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
      <div className="flex h-full">
        {/* Main Chat Area */}
        <div className={cn(
          "flex h-full flex-col transition-all duration-300",
          showBrowserPanel ? "w-1/2" : "w-full"
        )}>
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Monitor className="h-4 w-4 text-white" />
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
                        {message.status === "browsing" && (
                          <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                            <div className="relative">
                              <Monitor className="h-5 w-5 text-cyan-500" />
                              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Browsing</p>
                              <p className="text-xs text-muted-foreground">Agent is browsing the web for your task...</p>
                            </div>
                          </div>
                        )}
                        {message.steps.filter(s => s.type !== "browsing").map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            {getStepIcon(step.type, index === (message.steps?.filter(s => s.type !== "browsing").length || 0) - 1)}
                            <span>{step.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Content */}
                    {message.content && (
                      <div className={cn(
                        "prose prose-sm dark:prose-invert max-w-none",
                        message.status === "error" && "text-destructive"
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )}

                    {/* Work with me button */}
                    {message.role === "assistant" && showWorkWithMeButton && message.id === messages[messages.length - 1]?.id && (
                      <div className="mt-4">
                        <Button
                          onClick={handleWorkWithMe}
                          disabled={isLoading || isBrowserLoading}
                          className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                        >
                          {isBrowserLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Starting browser...
                            </>
                          ) : (
                            <>
                              <Hand className="h-4 w-4" />
                              Work with me
                            </>
                          )}
                        </Button>
                      </div>
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

                    {/* Slides Viewer */}
                    {message.slides && message.slides.length > 0 && (
                      <div className="mt-4">
                        <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-lg">
                          <div 
                            className="relative aspect-video overflow-hidden rounded-lg shadow-xl"
                            style={{ 
                              backgroundColor: message.slides[currentSlideIndex]?.backgroundColor || "#1e293b",
                              color: message.slides[currentSlideIndex]?.textColor || "#ffffff"
                            }}
                          >
                            {currentSlideIndex === 0 ? (
                              <div className="flex h-full flex-col items-center justify-center p-8">
                                <h1 className="mb-4 text-center text-3xl font-bold leading-tight md:text-4xl">
                                  {message.slides[currentSlideIndex]?.title}
                                </h1>
                                <div 
                                  className="mb-6 h-1 w-24 rounded-full"
                                  style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
                                />
                                <p className="text-center text-lg opacity-80">
                                  {message.slides[currentSlideIndex]?.content.join(' | ')}
                                </p>
                              </div>
                            ) : currentSlideIndex === message.slides.length - 1 ? (
                              <div className="flex h-full flex-col items-center justify-center p-8">
                                <h1 className="mb-6 text-center text-4xl font-bold">
                                  {message.slides[currentSlideIndex]?.title}
                                </h1>
                                <div className="space-y-2 text-center text-lg opacity-80">
                                  {message.slides[currentSlideIndex]?.content.map((item, i) => (
                                    <p key={i}>{item}</p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full flex-col p-6 md:p-8">
                                <h2 className="mb-2 text-2xl font-bold md:text-3xl">
                                  {message.slides[currentSlideIndex]?.title}
                                </h2>
                                <div 
                                  className="mb-6 h-1 w-16 rounded-full"
                                  style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
                                />
                                <ul className="flex-1 space-y-3">
                                  {message.slides[currentSlideIndex]?.content.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                                      <span 
                                        className="mt-2 h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
                                      />
                                      <span className="opacity-90">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="absolute bottom-4 right-4 rounded-full bg-black/30 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                              {currentSlideIndex + 1} / {message.slides.length}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {message.slides.map((slide, idx) => (
                              <button
                                key={slide.id}
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={cn(
                                  "relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all hover:opacity-100",
                                  currentSlideIndex === idx 
                                    ? "border-primary opacity-100 ring-2 ring-primary/30" 
                                    : "border-transparent opacity-60"
                                )}
                                style={{ backgroundColor: slide.backgroundColor }}
                              >
                                <div 
                                  className="flex h-full flex-col items-center justify-center p-1"
                                  style={{ color: slide.textColor }}
                                >
                                  <span className="truncate text-[6px] font-semibold">{slide.title}</span>
                                </div>
                                <span className="absolute bottom-0.5 right-0.5 text-[8px] opacity-60">{idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                              disabled={currentSlideIndex === 0}
                              className="gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSlideIndex(Math.min(message.slides!.length - 1, currentSlideIndex + 1))}
                              disabled={currentSlideIndex === message.slides.length - 1}
                              className="gap-1"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsFullscreen(true)}
                              className="gap-1.5"
                            >
                              <Play className="h-4 w-4" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              onClick={downloadSlides}
                              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              <Download className="h-4 w-4" />
                              Download PPTX
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions for assistant messages */}
                    {message.role === "assistant" && message.status === "completed" && !showWorkWithMeButton && (
                      <div className="mt-3 flex items-center gap-2">
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
                  placeholder="Assign another task..."
                  className="min-h-[40px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  rows={1}
                  disabled={isLoading}
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                      <Plus className="h-4 w-4" />
                    </Button>
                    
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

                    {/* Browser Panel Toggle */}
                    {browserSession && (
                      <button
                        onClick={() => setShowBrowserPanel(!showBrowserPanel)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          showBrowserPanel 
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30" 
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                        title="Toggle browser panel"
                      >
                        {showBrowserPanel ? (
                          <PanelRightClose className="h-3.5 w-3.5" />
                        ) : (
                          <PanelRightOpen className="h-3.5 w-3.5" />
                        )}
                        <span>Browser</span>
                      </button>
                    )}
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
            </div>
          </div>
        </div>

        {/* Browser Live View Panel */}
        {showBrowserPanel && browserSession && (
          <div className="flex w-1/2 flex-col border-l border-border bg-muted/30">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Monitor className="h-5 w-5 text-cyan-500" />
                  <span className="absolute -right-1 -top-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                </div>
                <span className="font-medium">Live Browser Session</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(browserSession.interactiveLiveViewUrl, '_blank')}
                  className="gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in new tab
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeBrowserSession}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Browser iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={browserSession.interactiveLiveViewUrl}
                className="h-full w-full border-0"
                title="Live Browser Session"
                allow="clipboard-read; clipboard-write"
              />
            </div>

            {/* Results section */}
            {browserResults.length > 0 && (
              <div className="border-t border-border bg-background p-4">
                <h4 className="mb-2 text-sm font-medium">Results</h4>
                <div className="max-h-40 overflow-auto rounded-lg bg-muted p-3">
                  {browserResults.map((result, index) => (
                    <pre key={index} className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {result}
                    </pre>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Initial view with prompt
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <h1 className="mb-8 text-xl font-semibold">Agents</h1>

      {/* Main Heading */}
      <h2 className="mb-12 text-center font-serif text-4xl md:text-5xl">
        What can I do for you?
      </h2>

      {/* Input Area */}
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Assign a task or ask anything"
            className="min-h-[60px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
            rows={2}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <HandIcon />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <SettingsIcon />
              </Button>
              
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

        {/* Tools Connection Bar */}
        {showToolsBar && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <ConnectIcon />
              <span className="text-sm text-muted-foreground">Powered by Firecrawl Browser Agent</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <ToolIcon type="browser" />
                <ToolIcon type="playwright" />
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

        {/* Action Buttons (Kimi-style) */}
        <ChatActionButtons 
          onAction={handleActionClick}
          activeAction={activeAction}
          className="mt-6"
        />
      </div>

      {/* Document Wizard (Kimi-style) */}
      <DocWizard 
        isOpen={docWizardOpen}
        onClose={() => setDocWizardOpen(false)}
        onGenerate={handleGenerateDoc}
        isGenerating={isGeneratingDoc}
      />

      {/* Slides Wizard (Kimi-style) */}
      <SlidesWizard
        isOpen={newSlidesWizardOpen}
        onClose={() => setNewSlidesWizardOpen(false)}
        onGenerate={handleGenerateNewSlides}
        isGenerating={isGeneratingNewSlides}
      />

      {/* Generated Document Display */}
      {generatedDocData && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-xl">
          <DocViewer 
            doc={generatedDocData}
            onClose={() => setGeneratedDocData(null)}
          />
        </div>
      )}

      {/* Generated Slides Display */}
      {generatedSlidesData && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-xl">
          <SlidesViewer 
            data={generatedSlidesData}
            onClose={() => setGeneratedSlidesData(null)}
          />
        </div>
      )}

      {/* Slide Creation Wizard Modal (Legacy) */}
      {slideMode === "wizard" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Create Presentation</h3>
              <Button variant="ghost" size="icon" onClick={() => setSlideMode("idle")}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {slideWizardStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">What is your presentation about?</label>
                  <textarea
                    value={slideDetails.topic}
                    onChange={(e) => setSlideDetails(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Quarterly sales report, Product launch strategy, Team introduction..."
                    className="min-h-[100px] w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSlideMode("idle")}>Cancel</Button>
                  <Button 
                    onClick={() => setSlideWizardStep(1)}
                    disabled={!slideDetails.topic.trim()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {slideWizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Who is your audience?</label>
                  <input
                    type="text"
                    value={slideDetails.audience}
                    onChange={(e) => setSlideDetails(prev => ({ ...prev, audience: e.target.value }))}
                    placeholder="e.g., Executive team, Investors, New employees..."
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Number of slides</label>
                  <select
                    value={slideDetails.slideCount}
                    onChange={(e) => setSlideDetails(prev => ({ ...prev, slideCount: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="3">3 slides (Brief)</option>
                    <option value="5">5 slides (Standard)</option>
                    <option value="8">8 slides (Detailed)</option>
                    <option value="12">12 slides (Comprehensive)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSlideWizardStep(0)}>Back</Button>
                  <Button onClick={() => setSlideWizardStep(2)}>Next</Button>
                </div>
              </div>
            )}

            {slideWizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Presentation style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "professional", label: "Professional", desc: "Clean and corporate" },
                      { value: "creative", label: "Creative", desc: "Bold and colorful" },
                      { value: "minimal", label: "Minimal", desc: "Simple and elegant" },
                      { value: "dark", label: "Dark Mode", desc: "Modern dark theme" },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSlideDetails(prev => ({ ...prev, style: style.value }))}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          slideDetails.style === style.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <p className="font-medium">{style.label}</p>
                        <p className="text-xs text-muted-foreground">{style.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSlideWizardStep(1)}>Back</Button>
                  <Button onClick={generateSlides}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Slides
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Presentation Mode */}
      {isFullscreen && generatedSlides.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col cursor-pointer select-none"
          style={{
            backgroundColor: generatedSlides[currentSlideIndex]?.backgroundColor || "#1e293b",
            color: generatedSlides[currentSlideIndex]?.textColor || "#ffffff"
          }}
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect()
            const x = e.clientX - rect.left
            if (x < rect.width / 2) {
              setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
            } else {
              setCurrentSlideIndex(Math.min(generatedSlides.length - 1, currentSlideIndex + 1))
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
            if (e.key === 'ArrowRight') setCurrentSlideIndex(Math.min(generatedSlides.length - 1, currentSlideIndex + 1))
            if (e.key === 'Escape') setIsFullscreen(false)
          }}
          tabIndex={0}
        >
          {currentSlideIndex === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12">
              <h1 className="mb-6 max-w-4xl text-center text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
                {generatedSlides[currentSlideIndex]?.title}
              </h1>
              <div 
                className="mb-8 h-1.5 w-32 rounded-full"
                style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
              />
              <p className="max-w-2xl text-center text-xl opacity-80 md:text-2xl">
                {generatedSlides[currentSlideIndex]?.content.join(' | ')}
              </p>
            </div>
          ) : currentSlideIndex === generatedSlides.length - 1 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12">
              <h1 className="mb-8 text-center text-5xl font-bold md:text-6xl lg:text-7xl">
                {generatedSlides[currentSlideIndex]?.title}
              </h1>
              <div className="space-y-4 text-center text-xl opacity-80 md:text-2xl">
                {generatedSlides[currentSlideIndex]?.content.map((item, i) => (
                  <p key={i}>{item}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-12 md:p-16 lg:p-20">
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                {generatedSlides[currentSlideIndex]?.title}
              </h1>
              <div 
                className="mb-10 h-1.5 w-24 rounded-full"
                style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
              />
              <ul className="flex-1 space-y-6">
                {generatedSlides[currentSlideIndex]?.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-xl md:text-2xl">
                    <span 
                      className="mt-3 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: slideDetails.style === 'minimal' ? '#0EA5E9' : '#3B82F6' }}
                    />
                    <span className="opacity-90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between bg-black/30 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
                {currentSlideIndex + 1} / {generatedSlides.length}
              </span>
              <span className="hidden text-sm opacity-60 md:block">
                Click left/right or use arrow keys to navigate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                }}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">Previous</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentSlideIndex(Math.min(generatedSlides.length - 1, currentSlideIndex + 1))
                }}
                disabled={currentSlideIndex === generatedSlides.length - 1}
              >
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="mx-2 h-6 w-px bg-white/20" />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFullscreen(false)
                }}
              >
                <X className="mr-1.5 h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
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
    browser: (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
        <Monitor className="h-3 w-3 text-white" />
      </div>
    ),
    playwright: (
      <div className="flex h-5 w-5 items-center justify-center rounded bg-green-600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
