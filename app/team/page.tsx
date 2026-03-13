import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Users, Zap, Link as LinkIcon, Lock, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function TeamPage() {
  const features = [
    {
      icon: Users,
      title: "Easy to get started",
      description: "The AI that makes your entire team expert-level productive, not just the tech-savvy ones.",
    },
    {
      icon: Zap,
      title: "Execute complex workflows in minutes",
      description: "WorkwithMe agents research, analyze, code, deploy, and manage tasks across your entire stack. Better yet, they can run tasks in parallel — delivering results in minutes.",
    },
    {
      icon: LinkIcon,
      title: "Collaborate with your teammates",
      description: "Work together in shared spaces where everyone can contribute. No more copy-pasting work deliverables.",
    },
    {
      icon: LinkIcon,
      title: "Connect with tools you already use",
      description: "WorkwithMe integrates seamlessly with your existing tools, Google Calendar, Github, Notion, Slack, and more.",
    },
    {
      icon: Lock,
      title: "Enterprise-Level security",
      description: "We are SOC 2 compliant. We do not train models on your data.",
    },
    {
      icon: BarChart3,
      title: "Effective user management",
      description: "Unified billing management. Credits are pooled across your team. We provide admin dashboard with usage stats.",
    },
  ]

  const useCases = [
    { category: "Strategy", title: "Australian dog food market" },
    { category: "Marketing", title: "Outdoor Ads Options in Japan" },
    { category: "Operations", title: "Book travel arrangements for a conference" },
    { category: "Finance", title: "Quarterly Budget Planning" },
    { category: "Data", title: "Extracting Data Online" },
    { category: "Website development", title: "AI Academy Podcast Website" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-background to-muted/30 px-4 py-24 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold md:text-5xl lg:text-6xl">
            Business AI That Works Like Your Best Employee.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Automate complex workflows, integrate your tools, and scale operations without adding headcount.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard">Get Team</Link>
            </Button>
            <Button variant="outline" size="lg">
              Contact sales
            </Button>
          </div>
        </section>

        {/* Features Carousel Placeholder */}
        <section className="border-y border-border bg-muted/20 px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center text-2xl font-semibold">From tedious to effortless.</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {["Web app", "Wide Research", "Scheduled task", "Cloud browser", "Data visualization", "Knowledge", "WorkwithMe's computer"].map((item) => (
                <Button key={item} variant="outline" className="rounded-full">
                  {item}
                </Button>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Instantly build full-stack apps. WorkwithMe automate the coding, database, deployment, and payments.</p>
            </div>
          </div>
        </section>

        {/* Secure Action Engine */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">A secure, collaborative Action Engine.</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border">
                  <CardContent className="p-6">
                    <feature.icon className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-muted/20 px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Extraordinary results that exceed your expectations.</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase) => (
                <Card key={useCase.title} className="border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <p className="mb-2 text-sm text-muted-foreground">{useCase.category}</p>
                    <h3 className="font-semibold">{useCase.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-3xl font-bold">Simple, transparent pricing</h2>
            <Card className="border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold">Team Plan</h3>
                <p className="mt-4 text-muted-foreground">Per seat / month</p>
                <div className="my-8 space-y-3 text-left">
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> Shared team pool credits per member per month</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> Unlimited access to Chat mode</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> Access to WorkwithMe 1.6 in Agent mode</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> 20 concurrent tasks per member</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> 20 scheduled tasks per member</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> Slides, image and video generation</p>
                  <p className="flex items-center gap-2"><span className="text-primary">✓</span> Early access to beta features</p>
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/dashboard">Get Team</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-muted/20 px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">Your trust is our priority.</span>
            </div>
            <Button variant="link" className="mt-2">Visit trust center</Button>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-24 text-center">
          <h2 className="text-3xl font-bold">Ready to empower your team?</h2>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/dashboard">Get Team</Link>
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  )
}
