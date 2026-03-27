"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import {
  Globe,
  Image as ImageIcon,
  Palette,
  Mail,
  Phone,
  FileText,
  Save,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Settings2,
  ShieldAlert,
  UserPlus,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Settings {
  site_name: string
  site_tagline: string
  site_logo_url: string
  site_favicon_url: string
  site_primary_color: string
  site_footer_text: string
  support_email: string
  support_phone: string
  maintenance_mode: string
  allow_registration: string
}

const DEFAULT: Settings = {
  site_name: "Codeat ERP",
  site_tagline: "Multi-tenant ERP for schools, companies, trusts, and NGOs",
  site_logo_url: "",
  site_favicon_url: "",
  site_primary_color: "#3b82f6",
  site_footer_text: "© 2025 Codeat ERP. All rights reserved.",
  support_email: "support@codeat.in",
  support_phone: "",
  maintenance_mode: "false",
  allow_registration: "true",
}

export default function GlobalSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [original, setOriginal] = useState<Settings>(DEFAULT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null) // section being saved
  const [logoPreview, setLogoPreview] = useState("")
  const [faviconPreview, setFaviconPreview] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await api.get("/admin/global-settings")
      const s = { ...DEFAULT, ...res.data.settings } as Settings
      setSettings(s)
      setOriginal(s)
      setLogoPreview(s.site_logo_url)
      setFaviconPreview(s.site_favicon_url)
    } catch {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const save = async (section: string, keys: (keyof Settings)[]) => {
    setIsSaving(section)
    const payload: Partial<Settings> = {}
    keys.forEach((k) => { payload[k] = settings[k] })
    try {
      const res = await api.patch("/admin/global-settings", payload)
      const s = { ...DEFAULT, ...res.data.settings } as Settings
      setSettings(s)
      setOriginal(s)
      toast({ title: "Saved", description: `${section} settings updated.` })
      // Apply title change live
      if (keys.includes("site_name")) document.title = settings.site_name
      // Apply favicon live
      if (keys.includes("site_favicon_url") && settings.site_favicon_url) {
        const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
        if (link) link.href = settings.site_favicon_url
      }
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setIsSaving(null)
    }
  }

  const set = (key: keyof Settings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const isDirty = (keys: (keyof Settings)[]) =>
    keys.some((k) => settings[k] !== original[k])

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground mt-1">
            Control the entire platform — branding, identity, and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="px-3 py-1.5">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Super Admin Only
          </Badge>
        </div>
      </div>

      {/* ── Section 1: Site Identity ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>Platform name and tagline shown across the app</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => set("site_name", e.target.value)}
                placeholder="Codeat ERP"
              />
              <p className="text-xs text-muted-foreground">Used as browser tab title and app header</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline">Tagline</Label>
              <Input
                id="site_tagline"
                value={settings.site_tagline}
                onChange={(e) => set("site_tagline", e.target.value)}
                placeholder="Your platform tagline"
              />
              <p className="text-xs text-muted-foreground">Shown on login page and landing page</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="site_footer_text">Footer Text</Label>
            <Input
              id="site_footer_text"
              value={settings.site_footer_text}
              onChange={(e) => set("site_footer_text", e.target.value)}
              placeholder="© 2025 Codeat ERP. All rights reserved."
            />
          </div>

          {/* Live preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="h-8 w-8 rounded object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white text-xs font-bold">
                  {settings.site_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{settings.site_name || "Site Name"}</p>
                <p className="text-xs text-muted-foreground">{settings.site_tagline || "Tagline"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
              {settings.site_footer_text}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save("Identity", ["site_name", "site_tagline", "site_footer_text"])}
              disabled={!isDirty(["site_name", "site_tagline", "site_footer_text"]) || isSaving === "Identity"}
            >
              {isSaving === "Identity" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Identity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Logo & Favicon ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Logo & Favicon</CardTitle>
              <CardDescription>Upload URLs for your logo and browser favicon</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label htmlFor="site_logo_url">Logo URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="site_logo_url"
                  value={settings.site_logo_url}
                  onChange={(e) => { set("site_logo_url", e.target.value); setLogoPreview(e.target.value) }}
                  placeholder="https://example.com/logo.png"
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Recommended: PNG/SVG, transparent background, min 200×200px</p>
            {logoPreview && (
              <div className="flex items-center gap-4 rounded-lg border p-3 bg-muted/20">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg object-contain border bg-white p-1"
                  onError={() => setLogoPreview("")}
                />
                <div>
                  <p className="text-sm font-medium">Logo Preview</p>
                  <p className="text-xs text-muted-foreground">This will appear in the header and login page</p>
                </div>
              </div>
            )}
          </div>

          {/* Favicon */}
          <div className="space-y-2">
            <Label htmlFor="site_favicon_url">Favicon URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="site_favicon_url"
                value={settings.site_favicon_url}
                onChange={(e) => { set("site_favicon_url", e.target.value); setFaviconPreview(e.target.value) }}
                placeholder="https://example.com/favicon.ico"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">Recommended: ICO or PNG, 32×32px or 64×64px</p>
            {faviconPreview && (
              <div className="flex items-center gap-4 rounded-lg border p-3 bg-muted/20">
                <img
                  src={faviconPreview}
                  alt="Favicon preview"
                  className="h-8 w-8 rounded object-contain border bg-white p-0.5"
                  onError={() => setFaviconPreview("")}
                />
                <div>
                  <p className="text-sm font-medium">Favicon Preview</p>
                  <p className="text-xs text-muted-foreground">Shown in browser tabs</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save("Branding", ["site_logo_url", "site_favicon_url"])}
              disabled={!isDirty(["site_logo_url", "site_favicon_url"]) || isSaving === "Branding"}
            >
              {isSaving === "Branding" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Brand Color ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-950">
              <Palette className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <CardTitle>Brand Color</CardTitle>
              <CardDescription>Primary color used across buttons, links, and accents</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="site_primary_color">Primary Color</Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="site_primary_color"
                  value={settings.site_primary_color}
                  onChange={(e) => set("site_primary_color", e.target.value)}
                  className="h-12 w-16 cursor-pointer rounded-lg border p-1"
                />
                <Input
                  value={settings.site_primary_color}
                  onChange={(e) => set("site_primary_color", e.target.value)}
                  placeholder="#3b82f6"
                  className="w-36 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            {/* Swatches */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
                  "#ef4444", "#06b6d4", "#ec4899", "#6366f1",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => set("site_primary_color", color)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                      settings.site_primary_color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Color preview */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
            <div className="flex gap-3 flex-wrap">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: settings.site_primary_color }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium border-2"
                style={{ borderColor: settings.site_primary_color, color: settings.site_primary_color }}
              >
                Outline Button
              </button>
              <span
                className="px-3 py-1 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: settings.site_primary_color }}
              >
                Badge
              </span>
              <a className="text-sm underline" style={{ color: settings.site_primary_color }}>
                Link text
              </a>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => save("Color", ["site_primary_color"])}
              disabled={!isDirty(["site_primary_color"]) || isSaving === "Color"}
            >
              {isSaving === "Color" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Color
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4: Support Contact ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Support Contact</CardTitle>
              <CardDescription>Contact details shown in emails and help sections</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="support_email">Support Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => set("support_email", e.target.value)}
                  placeholder="support@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_phone">Support Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="support_phone"
                  value={settings.support_phone}
                  onChange={(e) => set("support_phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => save("Contact", ["support_email", "support_phone"])}
              disabled={!isDirty(["support_email", "support_phone"]) || isSaving === "Contact"}
            >
              {isSaving === "Contact" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 5: Platform Behavior ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
              <Settings2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Platform Behavior</CardTitle>
              <CardDescription>Control registration and maintenance mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                settings.maintenance_mode === "true" ? "bg-red-100 dark:bg-red-950" : "bg-muted"
              )}>
                <ShieldAlert className={cn("h-5 w-5", settings.maintenance_mode === "true" ? "text-red-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-medium text-sm">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, only super admins can access the platform
                </p>
              </div>
            </div>
            <button
              onClick={() => set("maintenance_mode", settings.maintenance_mode === "true" ? "false" : "true")}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                settings.maintenance_mode === "true" ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                settings.maintenance_mode === "true" ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {/* Allow Registration */}
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                settings.allow_registration === "true" ? "bg-green-100 dark:bg-green-950" : "bg-muted"
              )}>
                <UserPlus className={cn("h-5 w-5", settings.allow_registration === "true" ? "text-green-600" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-medium text-sm">Allow Public Registration</p>
                <p className="text-xs text-muted-foreground">
                  Allow new organizations to self-register at /register
                </p>
              </div>
            </div>
            <button
              onClick={() => set("allow_registration", settings.allow_registration === "true" ? "false" : "true")}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                settings.allow_registration === "true" ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                settings.allow_registration === "true" ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>

          {settings.maintenance_mode === "true" && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              Maintenance mode is ON — regular users will see a maintenance page
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => save("Behavior", ["maintenance_mode", "allow_registration"])}
              disabled={!isDirty(["maintenance_mode", "allow_registration"]) || isSaving === "Behavior"}
            >
              {isSaving === "Behavior" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Behavior
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── All Settings Summary ─────────────────────────────────────────── */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">{key}</span>
                <span className="font-medium text-xs truncate max-w-[160px]" title={value}>
                  {value || <span className="text-muted-foreground italic">empty</span>}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
