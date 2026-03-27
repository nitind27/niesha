"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslation } from "@/hooks/useLanguage"
import { Button } from "@/components/ui/button"
import { School, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/lib/site-settings-context"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const [planContext, setPlanContext] = useState<string | null>(null)
  const { t } = useTranslation()
  const site = useSiteSettings()

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get("error")
    if (errorParam) {
      setError(errorParam)
      window.history.replaceState({}, "", window.location.pathname)
    }
    // Detect if coming from pricing page
    const redirect = params.get("redirect") || ""
    if (redirect.includes("/pricing") && redirect.includes("plan=")) {
      const planMatch = redirect.match(/plan=([^&]+)/)
      if (planMatch) setPlanContext(decodeURIComponent(planMatch[1]))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    // Clear general error
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const errors: Record<string, string> = {}
          data.details.forEach((detail: { path: string[]; message: string }) => {
            const fieldName = detail.path[0]
            errors[fieldName] = detail.message
          })
          setFieldErrors(errors)
          setError(data.error || "Please fix the errors below")
        } else {
          setError(data.error || "Registration failed")
        }
        return
      }

      const roleName =
        typeof data.user.role === "string"
          ? data.user.role
          : data.user.role?.name
      const redirectUrl =
        new URLSearchParams(window.location.search).get("redirect") ||
        (roleName === "super_admin" ? "/admin/super" : "/dashboard")

      window.location.assign(redirectUrl)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true)
    setError("")
    
    try {
      // Redirect to Google OAuth with register flag
      window.location.href = "/api/auth/google?register=true"
    } catch (err: any) {
      setError(err.message || "Google registration failed")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Gradient Orbs */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      {/* Register Card */}
      <div className={cn(
        "relative z-10 w-full max-w-md transition-all duration-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center">
              {site.site_logo_url ? (
                <img src={site.site_logo_url} alt={site.site_name} className="h-16 w-16 rounded-2xl object-contain shadow-lg" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <School className="h-8 w-8" />
                </div>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Create Account
            </h1>
            <p className="text-sm text-slate-600">{site.site_name}</p>
          </div>

          {/* Plan context banner */}
          {planContext && (
            <div className="mb-5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-3.5 flex items-start gap-3">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-500 p-1.5 rounded-lg flex-shrink-0">
                <School className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-800">Almost there!</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  Create your account to activate the <span className="font-bold capitalize">{planContext}</span> plan. You&apos;ll complete payment on the next step.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Register Button */}
          <Button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading || isLoading}
            variant="outline"
            className="mb-6 h-12 w-full border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-medium text-slate-700">
              {isGoogleLoading ? "Signing up..." : "Continue with Google"}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or sign up with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={cn(
                      "h-12 w-full rounded-lg border bg-white pl-10 pr-4 text-sm",
                      "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                      "transition-all",
                      fieldErrors.firstName ? "border-red-300" : "border-slate-300"
                    )}
                    placeholder="John"
                    required
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={cn(
                      "h-12 w-full rounded-lg border bg-white pl-10 pr-4 text-sm",
                      "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                      "transition-all",
                      fieldErrors.lastName ? "border-red-300" : "border-slate-300"
                    )}
                    placeholder="Doe"
                    required
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-white pl-10 pr-4 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all",
                    fieldErrors.email ? "border-red-300" : "border-slate-300"
                  )}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone Input (Optional) */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone <span className="text-slate-400">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-white pl-10 pr-4 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all",
                    fieldErrors.phone ? "border-red-300" : "border-slate-300"
                  )}
                  placeholder="+1234567890"
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-white pl-10 pr-12 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all",
                    fieldErrors.password ? "border-red-300" : "border-slate-300"
                  )}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={cn(
                    "h-12 w-full rounded-lg border bg-white pl-10 pr-12 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all",
                    fieldErrors.confirmPassword ? "border-red-300" : "border-slate-300"
                  )}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* OAuth Configuration Helper Link */}
          {error && error.includes("redirect_uri") && (
            <div className="mt-4 text-center">
              <Link
                href="/api/auth/google/test"
                target="_blank"
                className="text-xs text-primary hover:underline"
              >
                🔧 Need help configuring Google OAuth? Click here
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}

