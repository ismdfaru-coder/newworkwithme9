"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  ArrowUp, 
  Smile,
  Mic,
  Plus,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  FileText,
  Globe,
  Code,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  status?: "pending" | "processing" | "completed" | "error"
  taskId?: string
  steps?: TaskStep[]
  artifacts?: Artifact[]
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

interface ManusResponse {
  id?: string
  task_id?: string
  status?: string
  result?: string
  output?: string
  message?: string
  steps?: Array<{
    type: string
    description: string
  }>
  artifacts?: Array<{
    type: string
    title: string
    content?: string
    url?: string
  }>
}

export function ManusChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return

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
      // Update to processing status
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
                  description: "Searching for relevant information...",
                  timestamp: new Date(),
                }
              ]
            }
          : m
      ))

      const response = await fetch("/api/manus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage.content }),
      })

      const data: ManusResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get response")
      }

      // Process the response
      const responseContent = data.result || data.output || data.message || JSON.stringify(data, null, 2)
      
      // Parse artifacts if present
      const artifacts: Artifact[] = (data.artifacts || []).map((a, i) => ({
        id: crypto.randomUUID(),
        type: a.type as Artifact["type"] || "document",
        title: a.title || `Artifact ${i + 1}`,
        content: a.content,
        url: a.url,
      }))

      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { 
              ...m, 
              content: responseContent,
              status: "completed",
              taskId: data.task_id || data.id,
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

  const getStepIcon = (type: TaskStep["type"]) => {
    switch (type) {
      case "thinking":
        return <Sparkles className="h-3 w-3" />
      case "searching":
        return <Globe className="h-3 w-3" />
      case "analyzing":
        return <Code className="h-3 w-3" />
      case "writing":
        return <FileText className="h-3 w-3" />
      case "complete":
        return <Check className="h-3 w-3" />
      default:
        return <Loader2 className="h-3 w-3 animate-spin" />
    }
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

  if (messages.length === 0) {
    return null
  }

  return (
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
                {message.role === "assistant" && message.steps && message.status !== "completed" && (
                  <div className="mb-3 space-y-2">
                    {message.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        {step.type === "complete" ? (
                          getStepIcon(step.type)
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        <span>{step.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Content */}
                {message.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{message.content}</p>
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

                {/* Actions for assistant messages */}
                {message.role === "assistant" && message.status === "completed" && (
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
              placeholder="Ask a follow-up question..."
              className="min-h-[40px] w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
              rows={1}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
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
        </div>
      </div>
    </div>
  )
}
