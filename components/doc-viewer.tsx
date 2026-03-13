"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Download,
  FileText,
  ChevronDown,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface DocSection {
  heading: string
  content: string
}

export interface DocData {
  title: string
  sections: DocSection[]
}

interface DocViewerProps {
  doc: DocData
  style?: "professional" | "creative" | "minimal" | "dark"
  onClose?: () => void
}

export function DocViewer({ doc, style = "professional", onClose }: DocViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const styleColors = {
    professional: { bg: "bg-white", text: "text-slate-900", accent: "border-blue-500", headingBg: "bg-slate-50" },
    creative: { bg: "bg-purple-50", text: "text-purple-900", accent: "border-purple-500", headingBg: "bg-purple-100" },
    minimal: { bg: "bg-white", text: "text-gray-800", accent: "border-gray-300", headingBg: "bg-gray-50" },
    dark: { bg: "bg-slate-900", text: "text-slate-100", accent: "border-cyan-500", headingBg: "bg-slate-800" },
  }

  const colors = styleColors[style]

  const handleCopySection = async (content: string, heading: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedSection(heading)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import("jspdf")
      
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let yPosition = 20

      // Title
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      const titleLines = pdf.splitTextToSize(doc.title, maxWidth)
      pdf.text(titleLines, margin, yPosition)
      yPosition += titleLines.length * 10 + 15

      // Sections
      doc.sections.forEach((section) => {
        // Check if we need a new page
        if (yPosition > 260) {
          pdf.addPage()
          yPosition = 20
        }

        // Section heading
        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        const headingLines = pdf.splitTextToSize(section.heading, maxWidth)
        pdf.text(headingLines, margin, yPosition)
        yPosition += headingLines.length * 7 + 5

        // Section content
        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")
        const contentLines = pdf.splitTextToSize(section.content, maxWidth)
        
        contentLines.forEach((line: string) => {
          if (yPosition > 280) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(line, margin, yPosition)
          yPosition += 6
        })

        yPosition += 10
      })

      pdf.save(`${doc.title.replace(/[^a-z0-9]/gi, "_")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadDOCX = async () => {
    setIsDownloading(true)
    try {
      // Dynamic import to avoid SSR issues
      const docx = await import("docx")
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx
      
      const children = [
        // Title
        new Paragraph({
          text: doc.title,
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        }),
      ]

      // Add sections
      doc.sections.forEach((section) => {
        // Section heading
        children.push(
          new Paragraph({
            text: section.heading,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )

        // Section content - split by paragraphs
        const paragraphs = section.content.split("\n").filter(p => p.trim())
        paragraphs.forEach((para) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: para })],
              spacing: { after: 200 },
            })
          )
        })
      })

      const document = new Document({
        sections: [
          {
            properties: {},
            children,
          },
        ],
      })

      const blob = await Packer.toBlob(document)
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `${doc.title.replace(/[^a-z0-9]/gi, "_")}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating DOCX:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 shadow-lg">
      {/* Document Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold">{doc.title}</h3>
            <p className="text-xs text-muted-foreground">{doc.sections.length} sections</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Document Preview */}
      <div className={cn(
        "rounded-lg border-l-4 p-6 max-h-[400px] overflow-y-auto",
        colors.bg,
        colors.text,
        colors.accent
      )}>
        {/* Title */}
        <h1 className="mb-6 text-2xl font-bold">{doc.title}</h1>

        {/* Sections */}
        {doc.sections.map((section, idx) => (
          <div key={idx} className="mb-6 last:mb-0">
            <div className="group flex items-start justify-between">
              <h2 className={cn(
                "mb-3 text-lg font-semibold px-3 py-1 rounded -mx-3",
                colors.headingBg
              )}>
                {section.heading}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCopySection(section.content, section.heading)}
              >
                {copiedSection === section.heading ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Download Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="gap-2"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadDOCX}>
              <FileText className="mr-2 h-4 w-4" />
              Download as DOCX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Doc Creation Wizard Component
interface DocWizardProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (data: { topic: string; audience: string; style: string }) => void
  isGenerating: boolean
}

export function DocWizard({ isOpen, onClose, onGenerate, isGenerating }: DocWizardProps) {
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ topic: "", audience: "", style: "professional" })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Create Document</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">What is your document about?</label>
              <textarea
                value={details.topic}
                onChange={(e) => setDetails(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Market analysis for electric vehicles, Employee handbook update, Research summary..."
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
                placeholder="e.g., Executive team, Clients, Students, General public..."
                className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Document style</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "professional", label: "Professional", desc: "Formal and business-like" },
                  { value: "creative", label: "Creative", desc: "Engaging and expressive" },
                  { value: "minimal", label: "Minimal", desc: "Clean and concise" },
                  { value: "dark", label: "Technical", desc: "Detailed and precise" },
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
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button 
                onClick={() => {
                  onGenerate(details)
                  setDetails({ topic: "", audience: "", style: "professional" })
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
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Document
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
