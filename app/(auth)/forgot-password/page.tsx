"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/lib/site-settings-context"

type Step = "email" | "otp" | "reset" | "done"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [mounted, setMounted] = useState(false)

  // Fields
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const site = useSiteSettings()

  useEffect(() => { setMounted(true) }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send OTP")
      setStep("otp")
      setResendTimer(60)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const otpValue = otp.join("")
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid OTP")
      setStep("reset")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reset password")
      setStep("done")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    pasted.split("").forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    otpRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setError("")
    setOtp(["", "", "", "", "", ""])
    setIsLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setResendTimer(60)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className={cn(
        "relative z-10 w-full max-w-md transition-all duration-700",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">

          {/* Logo */}
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

            {step === "email" && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">Forgot Password?</h1>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a 6-digit OTP</p>
              </>
            )}
            {step === "otp" && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">Check your email</h1>
                <p className="text-sm text-slate-500">
                  We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>
                </p>
              </>
            )}
            {step === "reset" && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">Set new password</h1>
                <p className="text-sm text-slate-500">Choose a strong password for your account</p>
              </>
            )}
            {step === "done" && (
              <>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">Password reset!</h1>
                <p className="text-sm text-slate-500">Your password has been updated successfully</p>
              </>
            )}
          </div>

          {/* Step indicator */}
          {step !== "done" && (
            <div className="mb-6 flex items-center justify-center gap-2">
              {(["email", "otp", "reset"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    step === s
                      ? "bg-primary text-white"
                      : (["email", "otp", "reset"].indexOf(step) > i)
                        ? "bg-primary/20 text-primary"
                        : "bg-slate-100 text-slate-400"
                  )}>
                    {i + 1}
                  </div>
                  {i < 2 && <div className={cn("h-px w-8 transition-all", (["email", "otp", "reset"].indexOf(step) > i) ? "bg-primary/40" : "bg-slate-200")} />}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Step: Email ── */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Sending OTP..." : <>Send OTP <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          )}

          {/* ── Step: OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Enter 6-digit OTP</label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={cn(
                        "h-12 w-12 rounded-lg border text-center text-lg font-bold transition-all",
                        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        digit ? "border-primary bg-primary/5 text-primary" : "border-slate-300 bg-white text-slate-900"
                      )}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500">
                  OTP expires in 10 minutes
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center text-sm text-slate-500">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className={cn(
                    "font-medium transition-colors",
                    resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-primary hover:text-primary/80 cursor-pointer"
                  )}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]) }}
                className="flex w-full items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Change email
              </button>
            </form>
          )}

          {/* ── Step: Reset ── */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-medium text-slate-700">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Repeat your password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              {password && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      passwordStrength(password) >= level
                        ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-orange-400" : level <= 3 ? "bg-yellow-400" : "bg-green-500"
                        : "bg-slate-200"
                    )} />
                  ))}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {/* ── Step: Done ── */}
          {step === "done" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="h-12 w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                Go to Login <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Back to login */}
          {step !== "done" && (
            <div className="mt-6 text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function passwordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}
