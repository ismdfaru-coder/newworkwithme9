import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Get started with WorkwithMe",
      features: [
        "1,000 free credits",
        "300 daily refresh credits",
        "Basic chat mode access",
        "Standard agent mode",
        "Community support",
      ],
      cta: "Get Started",
      href: "/dashboard",
      popular: false,
    },
    {
      name: "Pro",
      price: "$20",
      period: "per month",
      description: "For individuals who need more power",
      features: [
        "10,000 credits per month",
        "Unlimited chat mode",
        "Advanced agent mode",
        "Priority support",
        "10 concurrent tasks",
        "10 scheduled tasks",
        "AI slides & image generation",
      ],
      cta: "Start Free Trial",
      href: "/dashboard",
      popular: true,
    },
    {
      name: "Team",
      price: "$39",
      period: "per seat / month",
      description: "For teams that want to scale",
      features: [
        "Shared team credit pool",
        "Unlimited chat mode",
        "Access to WorkwithMe 1.6",
        "20 concurrent tasks per member",
        "20 scheduled tasks per member",
        "Slides, image & video generation",
        "Early access to beta features",
        "Admin dashboard",
        "Unified billing",
      ],
      cta: "Get Team",
      href: "/team",
      popular: false,
    },
  ]

  const faqs = [
    {
      question: "Is my team's data secure with WorkwithMe?",
      answer: "Yes, WorkwithMe explicitly prohibits model providers from training on our Team/Enterprise Plan customers' data. Additionally, we provide granulated sharing controls that allow you to precisely manage how deliverables can be shared.",
    },
    {
      question: "What makes WorkwithMe different from other AI tools?",
      answer: "WorkwithMe is a genre-defining smart AI agent, not just another chatbot. It actively streamlines busywork and delivers production-ready results. With flexible team pricing and upcoming collaboration features, it transforms how teams work with AI.",
    },
    {
      question: "How does the flexible billing work?",
      answer: "You can invite members to your team anytime. Your bill adjusts at the next billing cycle to match your team size. Members can leave anytime if it doesn't work for them, with no additional charges.",
    },
    {
      question: "How do pooled credits benefit my team?",
      answer: "Each billed user adds credits to your team's shared pool. This eliminates waste and maximizes your subscription value. Team members who use AI heavily can tap into unused credits from lighter users.",
    },
    {
      question: "What if my team uses up all credits?",
      answer: "Team owners can purchase add-on credits in Team settings → Billing. You can also set up auto-purchase to prevent interruptions when credits run low.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="bg-muted/30 py-2 text-center text-sm">
        <span>WorkwithMe is now part of Meta — bringing AI to businesses worldwide</span>
        <span className="ml-1">→</span>
      </div>
      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-24 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">WorkwithMe Pricing Plans</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Choose the plan that fits your needs. Scale up or down anytime.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 pb-24">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative border-border ${plan.popular ? "border-2 border-primary shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> / {plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="mt-8 w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/20 px-4 py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Frequently asked questions</h2>
            <div className="space-y-8">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="mb-2 font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
