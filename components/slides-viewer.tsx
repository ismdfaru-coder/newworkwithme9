"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Loader2,
  Presentation,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Slide {
  id: string
  title: string
  content: string[]
  backgroundColor?: string
  textColor?: string
}

export interface SlidesData {
  topic: string
  slides: Slide[]
  style: "professional" | "creative" | "minimal" | "dark"
}

interface SlidesViewerProps {
  data: SlidesData
  onClose?: () => void
}

const styleColors = {
  professional: { bg: "#1e293b", text: "#ffffff", accent: "#3B82F6" },
  creative: { bg: "#7c3aed", text: "#ffffff", accent: "#F472B6" },
  minimal: { bg: "#ffffff", text: "#1e293b", accent: "#0EA5E9" },
  dark: { bg: "#0f172a", text: "#e2e8f0", accent: "#22D3EE" },
}

export function SlidesViewer({ data, onClose }: SlidesViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const colors = styleColors[data.style] || styleColors.professional
  const currentSlide = data.slides[currentSlideIndex]

  const downloadSlides = async () => {
    setIsDownloading(true)
    try {
      const pptxgen = (await import("pptxgenjs")).default
      
      const pres = new pptxgen()
      pres.author = "WorkwithMe AI"
      pres.title = data.topic
      pres.subject = `Presentation about ${data.topic}`
      
      const colorSchemes = {
        professional: { bg: "1e293b", title: "FFFFFF", text: "E2E8F0", accent: "3B82F6" },
        creative: { bg: "7c3aed", title: "FFFFFF", text: "E9D5FF", accent: "F472B6" },
        minimal: { bg: "FFFFFF", title: "1e293b", text: "475569", accent: "0EA5E9" },
        dark: { bg: "0f172a", title: "F8FAFC", text: "CBD5E1", accent: "22D3EE" },
      }
      const pptColors = colorSchemes[data.style] || colorSchemes.professional

      data.slides.forEach((slide, index) => {
        const pptSlide = pres.addSlide()
        pptSlide.background = { color: pptColors.bg }
        
        if (index === 0) {
          // Title slide
          pptSlide.addText(slide.title, {
            x: 0.5, y: "35%", w: "90%", h: 1.5,
            fontSize: 44, fontFace: "Arial",
            color: pptColors.title, bold: true, align: "center",
          })
          
          if (slide.content.length > 0) {
            pptSlide.addText(slide.content.join(" | "), {
              x: 0.5, y: "55%", w: "90%", h: 0.75,
              fontSize: 20, fontFace: "Arial",
              color: pptColors.text, align: "center",
            })
          }
          
          pptSlide.addShape("rect" as pptxgen.ShapeType, {
            x: "35%", y: "50%", w: "30%", h: 0.05,
            fill: { color: pptColors.accent },
          })
        } else if (index === data.slides.length - 1) {
          // Thank you slide
          pptSlide.addText(slide.title, {
            x: 0.5, y: "40%", w: "90%", h: 1.5,
            fontSize: 48, fontFace: "Arial",
            color: pptColors.title, bold: true, align: "center",
          })
          
          if (slide.content.length > 0) {
            pptSlide.addText(slide.content.join("\n"), {
              x: 0.5, y: "55%", w: "90%", h: 1,
              fontSize: 18, fontFace: "Arial",
              color: pptColors.text, align: "center",
            })
          }
        } else {
          // Content slides
          pptSlide.addText(slide.title, {
            x: 0.5, y: 0.5, w: "90%", h: 1,
            fontSize: 32, fontFace: "Arial",
            color: pptColors.title, bold: true,
          })
          
          pptSlide.addShape("rect" as pptxgen.ShapeType, {
            x: 0.5, y: 1.4, w: 1.5, h: 0.05,
            fill: { color: pptColors.accent },
          })
          
          const bulletPoints = slide.content.map(item => ({
            text: item,
            options: { 
              bullet: { type: "bullet" as const, color: pptColors.accent },
              color: pptColors.text, fontSize: 18, fontFace: "Arial",
              paraSpaceBefore: 12, paraSpaceAfter: 6,
            }
          }))
          
          pptSlide.addText(bulletPoints, {
            x: 0.5, y: 1.8, w: "90%", h: 3.5, valign: "top",
          })
        }
        
        if (index > 0) {
          pptSlide.addText(`${index + 1}`, {
            x: "90%", y: "92%", w: 0.5, h: 0.3,
            fontSize: 10, color: pptColors.text, align: "right",
          })
        }
      })

      await pres.writeFile({ fileName: `${data.topic.replace(/[^a-z0-9]/gi, "_")}_presentation.pptx` })
    } catch (error) {
      console.error("Error generating presentation:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Fullscreen presentation mode
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col cursor-pointer select-none"
        style={{ backgroundColor: colors.bg, color: colors.text }}
        onClick={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          const x = e.clientX - rect.left
          if (x < rect.width / 2) {
            setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
          } else {
            setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
          if (e.key === "ArrowRight") setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))
          if (e.key === "Escape") setIsFullscreen(false)
        }}
        tabIndex={0}
      >
        {currentSlideIndex === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12">
            <h1 className="mb-6 max-w-4xl text-center text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              {currentSlide?.title}
            </h1>
            <div className="mb-8 h-1.5 w-32 rounded-full" style={{ backgroundColor: colors.accent }} />
            <p className="max-w-2xl text-center text-xl opacity-80 md:text-2xl">
              {currentSlide?.content.join(" | ")}
            </p>
          </div>
        ) : currentSlideIndex === data.slides.length - 1 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12">
            <h1 className="mb-8 text-center text-5xl font-bold md:text-6xl lg:text-7xl">
              {currentSlide?.title}
            </h1>
            <div className="space-y-4 text-center text-xl opacity-80 md:text-2xl">
              {currentSlide?.content.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-12 md:p-16 lg:p-20">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{currentSlide?.title}</h1>
            <div className="mb-10 h-1.5 w-24 rounded-full" style={{ backgroundColor: colors.accent }} />
            <ul className="flex-1 space-y-6">
              {currentSlide?.content.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-xl md:text-2xl">
                  <span className="mt-3 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors.accent }} />
                  <span className="opacity-90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex items-center justify-between bg-black/30 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
              {currentSlideIndex + 1} / {data.slides.length}
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
                setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))
              }}
              disabled={currentSlideIndex === data.slides.length - 1}
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
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Presentation className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold">{data.topic}</h3>
            <p className="text-xs text-muted-foreground">{data.slides.length} slides</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Slide Preview */}
      <div 
        className="relative aspect-video overflow-hidden rounded-lg shadow-xl"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {currentSlideIndex === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <h1 className="mb-4 text-center text-3xl font-bold leading-tight md:text-4xl">
              {currentSlide?.title}
            </h1>
            <div className="mb-6 h-1 w-24 rounded-full" style={{ backgroundColor: colors.accent }} />
            <p className="text-center text-lg opacity-80">
              {currentSlide?.content.join(" | ")}
            </p>
          </div>
        ) : currentSlideIndex === data.slides.length - 1 ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <h1 className="mb-6 text-center text-4xl font-bold">{currentSlide?.title}</h1>
            <div className="space-y-2 text-center text-lg opacity-80">
              {currentSlide?.content.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col p-6 md:p-8">
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">{currentSlide?.title}</h2>
            <div className="mb-6 h-1 w-16 rounded-full" style={{ backgroundColor: colors.accent }} />
            <ul className="flex-1 space-y-3">
              {currentSlide?.content.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-base md:text-lg">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors.accent }} />
                  <span className="opacity-90">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 rounded-full bg-black/30 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          {currentSlideIndex + 1} / {data.slides.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {data.slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={cn(
              "relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all hover:opacity-100",
              currentSlideIndex === idx 
                ? "border-primary opacity-100 ring-2 ring-primary/30" 
                : "border-transparent opacity-60"
            )}
            style={{ backgroundColor: colors.bg }}
          >
            <div className="flex h-full flex-col items-center justify-center p-1" style={{ color: colors.text }}>
              <span className="truncate text-[6px] font-semibold">{slide.title}</span>
            </div>
            <span className="absolute bottom-0.5 right-0.5 text-[8px] opacity-60">{idx + 1}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
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
            onClick={() => setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === data.slides.length - 1}
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
            disabled={isDownloading}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PPTX
          </Button>
        </div>
      </div>
    </div>
  )
}

// Slides Creation Wizard Component
interface SlidesWizardProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (data: { topic: string; audience: string; slideCount: string; style: string }) => void
  isGenerating: boolean
}

export function SlidesWizard({ isOpen, onClose, onGenerate, isGenerating }: SlidesWizardProps) {
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ topic: "", audience: "", slideCount: "5", style: "professional" })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Create Presentation</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">What is your presentation about?</label>
              <textarea
                value={details.topic}
                onChange={(e) => setDetails(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Quarterly sales report, Product launch strategy, Team introduction..."
                className="min-h-[100px] w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={() => setStep(1)}
                disabled={!details.topic.trim()}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Who is your audience?</label>
              <input
                type="text"
                value={details.audience}
                onChange={(e) => setDetails(prev => ({ ...prev, audience: e.target.value }))}
                placeholder="e.g., Executive team, Investors, New employees..."
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Number of slides</label>
              <select
                value={details.slideCount}
                onChange={(e) => setDetails(prev => ({ ...prev, slideCount: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="3">3 slides (Brief)</option>
                <option value="5">5 slides (Standard)</option>
                <option value="8">8 slides (Detailed)</option>
                <option value="12">12 slides (Comprehensive)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Presentation style</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "professional", label: "Professional", desc: "Clean and corporate" },
                  { value: "creative", label: "Creative", desc: "Bold and colorful" },
                  { value: "minimal", label: "Minimal", desc: "Simple and elegant" },
                  { value: "dark", label: "Dark Mode", desc: "Modern dark theme" },
                ].map((styleOption) => (
                  <button
                    key={styleOption.value}
                    onClick={() => setDetails(prev => ({ ...prev, style: styleOption.value }))}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      details.style === styleOption.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <p className="font-medium">{styleOption.label}</p>
                    <p className="text-xs text-muted-foreground">{styleOption.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => {
                  onGenerate(details)
                  setDetails({ topic: "", audience: "", slideCount: "5", style: "professional" })
                  setStep(0)
                }}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Presentation className="mr-2 h-4 w-4" />
                    Generate Slides
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
