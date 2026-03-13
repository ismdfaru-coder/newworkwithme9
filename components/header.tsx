"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Globe,
  Smartphone,
  Paintbrush,
  Presentation,
  Monitor,
  Search,
  Mail,
  Sparkles,
  FileText,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Shield,
} from "lucide-react"

export function Header() {
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <WorkwithMeLogo />
            <span className="text-xl font-semibold">WorkwithMe</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {mounted ? (
              <>
                <DropdownMenu open={featuresOpen} onOpenChange={setFeaturesOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      Features
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Web app</div>
                          <div className="text-sm text-muted-foreground">Build full-stack, AI-powered sites</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Mobile app</div>
                          <div className="text-sm text-muted-foreground">Build native iOS & Android apps</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Paintbrush className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">AI design</div>
                          <div className="text-sm text-muted-foreground">Automates the entire design journey</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Presentation className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">AI slides</div>
                          <div className="text-sm text-muted-foreground">Use Nano Banana Pro to create slides</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">WorkwithMe browser operator</div>
                          <div className="text-sm text-muted-foreground">Lend a tab to WorkwithMe</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Wide Research</div>
                          <div className="text-sm text-muted-foreground">Parallel research at scale</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Mail WorkwithMe</div>
                          <div className="text-sm text-muted-foreground">Turn any email into action</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Agent Skills</div>
                          <div className="text-sm text-muted-foreground">Automate your expertise</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu open={resourcesOpen} onOpenChange={setResourcesOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      Resources
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Blog</div>
                          <div className="text-sm text-muted-foreground">Ideas, guides, and user stories</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/docs" className="flex items-center gap-3 p-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Docs</div>
                          <div className="text-sm text-muted-foreground">Learn about WorkwithMe and get started</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <RefreshCw className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Updates</div>
                          <div className="text-sm text-muted-foreground">{"What's new with WorkwithMe?"}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Use cases</div>
                          <div className="text-sm text-muted-foreground">Best practices in action</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#" className="flex items-center gap-3 p-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Trust center</div>
                          <div className="text-sm text-muted-foreground">Security and compliance</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Features
                </Button>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Resources
                </Button>
              </>
            )}

            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="#">Events</Link>
            </Button>

            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/team">Business</Link>
            </Button>

            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function WorkwithMeLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="currentColor"
      />
    </svg>
  )
}
