import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const docsSections = [
  {
    title: "Introduction",
    items: [
      { title: "Welcome", href: "/docs", active: true },
      { title: "Getting Started", href: "/docs/getting-started" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { title: "Tasks", href: "/docs/tasks" },
      { title: "Agents", href: "/docs/agents" },
      { title: "Skills", href: "/docs/skills" },
      { title: "Connectors", href: "/docs/connectors" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Web App", href: "/docs/web-app" },
      { title: "AI Design", href: "/docs/ai-design" },
      { title: "AI Slides", href: "/docs/ai-slides" },
      { title: "Wide Research", href: "/docs/wide-research" },
      { title: "Browser Operator", href: "/docs/browser-operator" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "Google Workspace", href: "/docs/google" },
      { title: "GitHub", href: "/docs/github" },
      { title: "Slack", href: "/docs/slack" },
      { title: "Notion", href: "/docs/notion" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Tasks API", href: "/docs/api/tasks" },
      { title: "Agents API", href: "/docs/api/agents" },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-muted/20 p-6 lg:block">
          <nav className="space-y-6">
            {docsSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                          item.active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-12 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span>Introduction</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Welcome</span>
            </div>

            {/* Content */}
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <div className="mb-6 rounded-lg bg-muted/50 p-4 text-sm">
                <strong>Learn about WorkwithMe and how to get started</strong>
              </div>

              <h1>Welcome</h1>

              <p>
                WorkwithMe AI is an autonomous general AI agent designed to complete tasks and deliver results. 
                Unlike traditional chatbots that simply answer questions, WorkwithMe AI takes action. 
                Think of WorkwithMe AI as a virtual colleague with its own computer, capable of planning, 
                executing, and delivering complete work products from start to finish.
              </p>

              <h2>What Makes WorkwithMe AI Different?</h2>

              <p>
                Traditional AI tools require constant supervision and manual intervention. You guide them 
                step by step, then piece together the results yourself. WorkwithMe AI works differently. 
                It operates in a complete sandbox environment—a virtual computer with internet access, 
                a persistent file system, and the ability to install software and create custom tools. 
                This means WorkwithMe AI can work independently, remember context across long tasks, 
                and deliver production-ready results without you managing every detail.
              </p>

              <h2>Key Capabilities</h2>

              <ul>
                <li><strong>Autonomous Execution</strong> - Completes multi-step tasks independently</li>
                <li><strong>Web Research</strong> - Browses the internet to gather information</li>
                <li><strong>Code Generation</strong> - Writes, tests, and deploys code</li>
                <li><strong>Document Creation</strong> - Generates reports, presentations, and documents</li>
                <li><strong>Data Analysis</strong> - Processes and visualizes data</li>
                <li><strong>Tool Integration</strong> - Connects with your existing tools and workflows</li>
              </ul>

              <h2>Getting Started</h2>

              <p>
                Ready to start using WorkwithMe? Here are some quick ways to get going:
              </p>

              <ol>
                <li><strong>Create your first task</strong> - Simply describe what you need done in natural language</li>
                <li><strong>Connect your tools</strong> - Link WorkwithMe to Google, GitHub, Slack, and more</li>
                <li><strong>Explore use cases</strong> - Check out examples of what WorkwithMe can do</li>
              </ol>

              <div className="mt-8 flex gap-4">
                <Link 
                  href="/docs/getting-started" 
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium no-underline hover:bg-muted"
                >
                  Try WorkwithMe
                </Link>
              </div>
            </article>

            {/* Footer Navigation */}
            <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
              <div />
              <Link 
                href="/docs/getting-started" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Getting Started
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Built with */}
            <p className="mt-12 text-center text-sm text-muted-foreground">
              Built with Mintlify.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
