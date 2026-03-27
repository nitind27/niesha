"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Briefcase,
  Palette,
  Globe,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Languages,
} from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ORGANIZATION_TYPES } from "@/lib/organization-labels"
import { ErpModuleStrip } from "@/components/erp/erp-module-strip"

const schoolInfoSchema = z.object({
  name: z.string().min(1, "School name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
})

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  faviconUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
})

const languageSchema = z.object({
  defaultLanguage: z.string().min(2).max(10),
  supportedLanguages: z.array(z.string()).min(1, "At least one language must be selected"),
})

const organizationSchema = z.object({
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]),
  industry: z.string().max(120).optional().or(z.literal("")),
})

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [school, setSchool] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    formState: { errors: errorsInfo },
    reset: resetInfo,
    watch: watchInfo,
  } = useForm<z.infer<typeof schoolInfoSchema>>({
    resolver: zodResolver(schoolInfoSchema),
  })

  const {
    register: registerTheme,
    handleSubmit: handleSubmitTheme,
    formState: { errors: errorsTheme },
    reset: resetTheme,
    watch: watchTheme,
    setValue: setThemeValue,
  } = useForm<z.infer<typeof themeSchema>>({
    resolver: zodResolver(themeSchema),
  })

  const {
    register: registerLanguage,
    handleSubmit: handleSubmitLanguage,
    formState: { errors: errorsLanguage },
    reset: resetLanguage,
    watch: watchLanguage,
    setValue: setLanguageValue,
  } = useForm<z.infer<typeof languageSchema>>({
    resolver: zodResolver(languageSchema),
  })

  const {
    register: registerOrg,
    handleSubmit: handleSubmitOrg,
    formState: { errors: errorsOrg },
    reset: resetOrg,
  } = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { organizationType: "school", industry: "" },
  })

  const watchedPrimaryColor = watchTheme("primaryColor")
  const watchedSecondaryColor = watchTheme("secondaryColor")
  const watchedAccentColor = watchTheme("accentColor")
  const watchedSupportedLanguages = watchLanguage("supportedLanguages") || []

  useEffect(() => {
    fetchSchool()
  }, [])

  const fetchSchool = async () => {
    try {
      const response = await api.get("/settings")
      const schoolData = response.data.school
      setSchool(schoolData)

      // Reset forms with school data
      resetInfo({
        name: schoolData.name || "",
        email: schoolData.email || "",
        phone: schoolData.phone || "",
        address: schoolData.address || "",
        city: schoolData.city || "",
        state: schoolData.state || "",
        country: schoolData.country || "",
        zipCode: schoolData.zipCode || "",
        website: schoolData.website || "",
      })

      resetTheme({
        primaryColor: schoolData.primaryColor || "#3b82f6",
        secondaryColor: schoolData.secondaryColor || "#8b5cf6",
        accentColor: schoolData.accentColor || "#10b981",
        logoUrl: schoolData.logoUrl || "",
        faviconUrl: schoolData.faviconUrl || "",
      })

      resetLanguage({
        defaultLanguage: schoolData.defaultLanguage || "en",
        supportedLanguages: schoolData.supportedLanguages || ["en"],
      })

      resetOrg({
        organizationType: (schoolData.organizationType as z.infer<typeof organizationSchema>["organizationType"]) || "school",
        industry: schoolData.industry || "",
      })
    } catch (error: any) {
      console.error("Failed to fetch school:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to load school settings",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSaveInfo = async (data: z.infer<typeof schoolInfoSchema>) => {
    setIsSaving(true)
    setSaveStatus("idle")
    try {
      await api.patch("/settings", data)
      setSaveStatus("success")
      toast({
        variant: "success",
        title: "Settings Updated",
        description: "School information has been updated successfully.",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
      fetchSchool()
    } catch (error: any) {
      setSaveStatus("error")
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update school information",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const onSaveTheme = async (data: z.infer<typeof themeSchema>) => {
    setIsSaving(true)
    setSaveStatus("idle")
    try {
      await api.patch("/settings", data)
      setSaveStatus("success")
      toast({
        variant: "success",
        title: "Theme Updated",
        description: "Theme settings have been updated successfully.",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
      fetchSchool()
    } catch (error: any) {
      setSaveStatus("error")
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update theme settings",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const onSaveOrg = async (data: z.infer<typeof organizationSchema>) => {
    setIsSaving(true)
    setSaveStatus("idle")
    try {
      await api.patch("/settings", {
        organizationType: data.organizationType,
        industry: data.industry?.trim() || null,
      })
      setSaveStatus("success")
      toast({
        variant: "success",
        title: "Organization updated",
        description: "Profile type and industry saved.",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
      fetchSchool()
    } catch (error: any) {
      setSaveStatus("error")
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.response?.data?.error || "Could not save organization profile",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const onSaveLanguage = async (data: z.infer<typeof languageSchema>) => {
    setIsSaving(true)
    setSaveStatus("idle")
    try {
      await api.patch("/settings", data)
      setSaveStatus("success")
      toast({
        variant: "success",
        title: "Language Settings Updated",
        description: "Language settings have been updated successfully.",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
      fetchSchool()
    } catch (error: any) {
      setSaveStatus("error")
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.error || "Failed to update language settings",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLanguageToggle = (langCode: string) => {
    const current = watchedSupportedLanguages
    if (current.includes(langCode)) {
      if (current.length > 1) {
        setLanguageValue("supportedLanguages", current.filter((l) => l !== langCode))
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "At least one language must be selected",
        })
      }
    } else {
      setLanguageValue("supportedLanguages", [...current, langCode])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings and preferences</p>
        </div>
        {school && (
          <Badge variant="outline" className="text-sm">
            {school.status === "active" ? "Active" : school.status}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Language
          </TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-6 animate-in slide-in-from-left duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription>Update your school&apos;s basic information and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitInfo(onSaveInfo)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">
                      School Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...registerInfo("name")}
                      placeholder="Enter school name"
                    />
                    {errorsInfo.name && (
                      <p className="text-sm text-destructive">{errorsInfo.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        {...registerInfo("email")}
                        placeholder="school@example.com"
                        className="pl-10"
                      />
                    </div>
                    {errorsInfo.email && (
                      <p className="text-sm text-destructive">{errorsInfo.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        {...registerInfo("phone")}
                        placeholder="+1234567890"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        {...registerInfo("address")}
                        placeholder="123 Education Street"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...registerInfo("city")}
                      placeholder="New York"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      {...registerInfo("state")}
                      placeholder="NY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...registerInfo("country")}
                      placeholder="USA"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      {...registerInfo("zipCode")}
                      placeholder="10001"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        {...registerInfo("website")}
                        placeholder="https://www.example.com"
                        className="pl-10"
                      />
                    </div>
                    {errorsInfo.website && (
                      <p className="text-sm text-destructive">{errorsInfo.website.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved successfully
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      Save failed
                    </div>
                  )}
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6 animate-in slide-in-from-left duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Organization profile
              </CardTitle>
              <CardDescription>
                School, company, trust, or NGO — labels and ERP hints follow this setting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitOrg(onSaveOrg)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="organizationType">Organization type</Label>
                    <select
                      id="organizationType"
                      {...registerOrg("organizationType")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {ORGANIZATION_TYPES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {errorsOrg.organizationType && (
                      <p className="text-sm text-destructive">{errorsOrg.organizationType.message}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="industry">Industry / focus (optional)</Label>
                    <Input
                      id="industry"
                      {...registerOrg("industry")}
                      placeholder="e.g. K-12, manufacturing, healthcare CSR"
                    />
                    {errorsOrg.industry && (
                      <p className="text-sm text-destructive">{errorsOrg.industry.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved successfully
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      Save failed
                    </div>
                  )}
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save organization
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings Tab */}
        <TabsContent value="theme" className="space-y-6 animate-in slide-in-from-left duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Customization
              </CardTitle>
              <CardDescription>Customize your school&apos;s branding colors and logo</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTheme(onSaveTheme)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">
                      Primary Color <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primaryColor"
                        type="color"
                        {...registerTheme("primaryColor")}
                        className="h-12 w-20 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={watchedPrimaryColor || "#3b82f6"}
                        onChange={(e) => setThemeValue("primaryColor", e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="h-12 rounded-md border"
                      style={{ backgroundColor: watchedPrimaryColor || "#3b82f6" }}
                    />
                    {errorsTheme.primaryColor && (
                      <p className="text-sm text-destructive">{errorsTheme.primaryColor.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">
                      Secondary Color <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="secondaryColor"
                        type="color"
                        {...registerTheme("secondaryColor")}
                        className="h-12 w-20 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={watchedSecondaryColor || "#8b5cf6"}
                        onChange={(e) => setThemeValue("secondaryColor", e.target.value)}
                        placeholder="#8b5cf6"
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="h-12 rounded-md border"
                      style={{ backgroundColor: watchedSecondaryColor || "#8b5cf6" }}
                    />
                    {errorsTheme.secondaryColor && (
                      <p className="text-sm text-destructive">{errorsTheme.secondaryColor.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">
                      Accent Color <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="accentColor"
                        type="color"
                        {...registerTheme("accentColor")}
                        className="h-12 w-20 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={watchedAccentColor || "#10b981"}
                        onChange={(e) => setThemeValue("accentColor", e.target.value)}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="h-12 rounded-md border"
                      style={{ backgroundColor: watchedAccentColor || "#10b981" }}
                    />
                    {errorsTheme.accentColor && (
                      <p className="text-sm text-destructive">{errorsTheme.accentColor.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="logoUrl"
                        type="url"
                        {...registerTheme("logoUrl")}
                        placeholder="https://example.com/logo.png"
                        className="pl-10"
                      />
                    </div>
                    {errorsTheme.logoUrl && (
                      <p className="text-sm text-destructive">{errorsTheme.logoUrl.message}</p>
                    )}
                    {watchTheme("logoUrl") && (
                      <div className="mt-2">
                        <img
                          src={watchTheme("logoUrl")}
                          alt="Logo preview"
                          className="h-20 w-auto rounded-md border object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="faviconUrl"
                        type="url"
                        {...registerTheme("faviconUrl")}
                        placeholder="https://example.com/favicon.ico"
                        className="pl-10"
                      />
                    </div>
                    {errorsTheme.faviconUrl && (
                      <p className="text-sm text-destructive">{errorsTheme.faviconUrl.message}</p>
                    )}
                    {watchTheme("faviconUrl") && (
                      <div className="mt-2">
                        <img
                          src={watchTheme("faviconUrl")}
                          alt="Favicon preview"
                          className="h-8 w-8 rounded border object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved successfully
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      Save failed
                    </div>
                  )}
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Theme
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings Tab */}
        <TabsContent value="language" className="space-y-6 animate-in slide-in-from-left duration-300">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language Settings
              </CardTitle>
              <CardDescription>Configure default language and supported languages for your school</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLanguage(onSaveLanguage)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">
                      Default Language <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="defaultLanguage"
                      {...registerLanguage("defaultLanguage")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {AVAILABLE_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    {errorsLanguage.defaultLanguage && (
                      <p className="text-sm text-destructive">{errorsLanguage.defaultLanguage.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Supported Languages <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {AVAILABLE_LANGUAGES.map((lang) => (
                        <div
                          key={lang.code}
                          onClick={() => handleLanguageToggle(lang.code)}
                          className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer transition-all ${
                            watchedSupportedLanguages.includes(lang.code)
                              ? "border-primary bg-primary/10"
                              : "border-input hover:bg-accent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={watchedSupportedLanguages.includes(lang.code)}
                            onChange={() => handleLanguageToggle(lang.code)}
                            className="rounded"
                          />
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                        </div>
                      ))}
                    </div>
                    {errorsLanguage.supportedLanguages && (
                      <p className="text-sm text-destructive">{errorsLanguage.supportedLanguages.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved successfully
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      Save failed
                    </div>
                  )}
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Language Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <ErpModuleStrip module="settings" />
      </div>
    </div>
  )
}
