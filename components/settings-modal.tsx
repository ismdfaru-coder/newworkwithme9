"use client"

import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import {
  User,
  Settings,
  Sparkles,
  Calendar,
  Mail,
  Database,
  Monitor,
  Users,
  Puzzle,
  Link as LinkIcon,
  Wrench,
  HelpCircle,
  ExternalLink,
  LogOut,
  UserCog,
  X,
} from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

const settingsNavItems = [
  { id: "account", icon: User, label: "Account" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "usage", icon: Sparkles, label: "Usage" },
  { id: "scheduled", icon: Calendar, label: "Scheduled tasks" },
  { id: "mail", icon: Mail, label: "Mail WorkwithMe" },
  { id: "data", icon: Database, label: "Data controls" },
  { id: "cloud", icon: Monitor, label: "Cloud browser" },
  { id: "personalization", icon: Users, label: "Personalization" },
  { id: "skills", icon: Puzzle, label: "Skills" },
  { id: "connectors", icon: LinkIcon, label: "Connectors" },
  { id: "integrations", icon: Wrench, label: "Integrations" },
]

export function SettingsModal({ open, onOpenChange, activeTab, onTabChange }: SettingsModalProps) {
  const router = useRouter()

  const handleSignOut = () => {
    onOpenChange(false)
    router.push("/")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-w-4xl gap-0 p-0" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Settings</DialogTitle>
        </VisuallyHidden>
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-background p-4">
          <div className="mb-6 flex items-center gap-2">
            <WorkwithMeLogo />
            <span className="font-semibold">WorkwithMe</span>
          </div>

          <nav className="space-y-1">
            {settingsNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeTab === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
              Get help
              <ExternalLink className="ml-auto h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">
              {settingsNavItems.find((item) => item.id === activeTab)?.label || "Settings"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6">
            {activeTab === "account" && <AccountContent onSignOut={handleSignOut} />}
            {activeTab === "settings" && <SettingsContent />}
            {activeTab === "usage" && <UsageContent />}
            {activeTab === "cloud" && <CloudBrowserContent />}
            {activeTab === "data" && <DataControlsContent />}
            {activeTab === "personalization" && <PersonalizationContent />}
            {activeTab === "skills" && <SkillsContent />}
            {activeTab === "connectors" && <ConnectorsContent />}
            {activeTab === "integrations" && <IntegrationsContent />}
            {activeTab === "scheduled" && <ScheduledTasksContent />}
            {activeTab === "mail" && <MailContent />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AccountContent({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-teal-500 text-2xl text-white">L</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">lagerrmizar23f+dipzm</h3>
            <p className="text-sm text-muted-foreground">lagerrmizar23f+dipzm@outlook.com</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <UserCog className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Plan Section */}
      <div className="rounded-lg bg-muted/50 p-6">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold">Free</span>
          <Button>Upgrade</Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Credits</span>
              <HelpCircle className="h-3 w-3 text-muted-foreground" />
            </div>
            <span className="font-semibold">1,000</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Free credits</span>
            <span>1,000</span>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Daily refresh credits</span>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="font-semibold">300</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Refresh to 300 at 00:00 every day</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Theme</h3>
          <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
        </div>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option>System</option>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div>
          <h3 className="font-medium">Language</h3>
          <p className="text-sm text-muted-foreground">Select your preferred language</p>
        </div>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <div>
          <h3 className="font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">Receive email notifications</p>
        </div>
        <Switch />
      </div>
    </div>
  )
}

function UsageContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-6">
        <h3 className="mb-4 font-semibold">Credit Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Credits used today</span>
            <span className="font-semibold">150</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Credits remaining</span>
            <span className="font-semibold">1,150</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-1/4 rounded-full bg-teal-500" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="mb-4 font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity to show.</p>
      </div>
    </div>
  )
}

function CloudBrowserContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="font-medium">Persist login state across tasks</h3>
          <a href="#" className="text-sm text-teal-600 hover:underline">Learn more</a>
        </div>
        <Switch />
      </div>

      <div className="flex items-center justify-between">
        <span>Cookies and other website data</span>
        <Button variant="outline">Manage</Button>
      </div>
    </div>
  )
}

function DataControlsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="font-medium">Data retention</h3>
          <p className="text-sm text-muted-foreground">Control how long your data is stored</p>
        </div>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option>30 days</option>
          <option>90 days</option>
          <option>1 year</option>
          <option>Forever</option>
        </select>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="font-medium">Export data</h3>
          <p className="text-sm text-muted-foreground">Download all your data</p>
        </div>
        <Button variant="outline">Export</Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-destructive">Delete account</h3>
          <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
        </div>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  )
}

function PersonalizationContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h3 className="font-medium">Enable personalization</h3>
          <p className="text-sm text-muted-foreground">Allow WorkwithMe to learn from your interactions</p>
        </div>
        <Switch defaultChecked />
      </div>

      <div className="rounded-lg border border-border p-6">
        <h3 className="mb-4 font-semibold">Your preferences</h3>
        <p className="text-sm text-muted-foreground">No preferences saved yet. WorkwithMe will learn from your interactions.</p>
      </div>
    </div>
  )
}

function SkillsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Custom Skills</h3>
        <Button>Create skill</Button>
      </div>

      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Puzzle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No skills yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Create custom skills to automate repetitive tasks.</p>
      </div>
    </div>
  )
}

function ConnectorsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Connected Services</h3>
        <Button>Add connector</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {["Google", "GitHub", "Notion", "Slack", "Linear", "Figma"].map((service) => (
          <div key={service} className="flex items-center justify-between rounded-lg border border-border p-4">
            <span className="font-medium">{service}</span>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntegrationsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">API Access</h3>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h4 className="font-medium">API Key</h4>
        <p className="mt-2 text-sm text-muted-foreground">Use this key to integrate WorkwithMe with your applications.</p>
        <div className="mt-4 flex gap-2">
          <input
            type="password"
            value="sk-xxxxxxxxxxxxxxxxxxxxx"
            readOnly
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button variant="outline">Copy</Button>
          <Button variant="outline">Regenerate</Button>
        </div>
      </div>
    </div>
  )
}

function ScheduledTasksContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Scheduled Tasks</h3>
        <Button>Create task</Button>
      </div>

      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No scheduled tasks</h3>
        <p className="mt-2 text-sm text-muted-foreground">Schedule tasks to run automatically at specific times.</p>
      </div>
    </div>
  )
}

function MailContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-6">
        <h3 className="font-semibold">Mail WorkwithMe</h3>
        <p className="mt-2 text-muted-foreground">Send emails to WorkwithMe to create tasks automatically.</p>
        <div className="mt-4 rounded-md bg-background p-3 font-mono text-sm">
          your-unique-id@mail.workwithme.ai
        </div>
        <Button className="mt-4" variant="outline">Copy email address</Button>
      </div>
    </div>
  )
}

function WorkwithMeLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="currentColor"
      />
    </svg>
  )
}
