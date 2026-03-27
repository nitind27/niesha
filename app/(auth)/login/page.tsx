"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslation } from "@/hooks/useLanguage"
import { Button } from "@/components/ui/button"
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/lib/site-settings-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [prefillHint, setPrefillHint] = useState<string | null>(null)
  const [planContext, setPlanContext] = useState<string | null>(null)
  const { t } = useTranslation()
  const site = useSiteSettings()

  useEffect(() => {
    setMounted(true)

    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get("email")
    if (emailParam) {
      const decoded = decodeURIComponent(emailParam.trim())
      if (decoded) setEmail(decoded)
    }
    const hint = params.get("hint")
    if (hint === "new_admin" || hint === "new_tenant") {
      setPrefillHint(hint)
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      const redirectParam = new URLSearchParams(window.location.search).get("redirect")
      const redirectUrl =
        redirectParam ||
        (data.user.role === "super_admin" ? "/admin/super" : "/dashboard")

      // Full navigation so the httpOnly session cookie is always sent on the next
      // load (client router.push can race with /api/auth/me and look "logged out").
      window.location.assign(redirectUrl)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")
    
    try {
      // Redirect to Google OAuth
      window.location.href = "/api/auth/google"
    } catch (err: any) {
      setError(err.message || "Google login failed")
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

      {/* Login Card */}
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
                  <Building2 className="h-8 w-8" />
                </div>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-600">{site.site_name}</p>
          </div>

          {planContext && (
            <div className="mb-5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-3.5 flex items-start gap-3">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-500 p-1.5 rounded-lg flex-shrink-0">
                <School className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-800">Sign in to continue</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  Sign in to activate the <span className="font-bold capitalize">{planContext}</span> plan. Payment completes on the next step.{" "}
                  <Link
                    href={`/register${typeof window !== "undefined" ? window.location.search : ""}`}
                    className="underline font-semibold"
                  >
                    New here? Register
                  </Link>
                </p>
              </div>
            </div>
          )}

          {prefillHint === "new_admin" && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm text-slate-700">
              New admin account — enter the password you set (email is filled below), then sign in to open that
              user&apos;s dashboard.
            </div>
          )}
          {prefillHint === "new_tenant" && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-sm text-slate-700">
              New tenant administrator — use the password you chose when creating the organization.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
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
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all"
                  )}
                  placeholder="Enter your email"
                  required
                />
              </div>
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-sm",
                    "placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    "transition-all"
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
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("auth.loggingIn")}
                </>
              ) : (
                <>
                  {t("auth.login")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
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
          By signing in, you agree to our{" "}
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
