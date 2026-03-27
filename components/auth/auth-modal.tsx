"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, Phone,
  ArrowRight, School, CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after successful login or register with the user object */
  onSuccess: (user: { id: string; email: string; firstName: string; role: string; schoolId?: string }) => void
  /** Pre-select tab */
  defaultTab?: "login" | "register"
  /** Context message shown at top */
  contextMessage?: string
}

export function AuthModal({ open, onOpenChange, onSuccess, defaultTab = "register", contextMessage }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" })

  // Register state
  const [regData, setRegData] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const resetErrors = () => { setError(""); setFieldErrors({}) }

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")
      onSuccess(data.user)
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.details) {
          const errs: Record<string, string> = {}
          data.details.forEach((d: { path: string[]; message: string }) => { errs[d.path[0]] = d.message })
          setFieldErrors(errs)
          setError(data.error || "Please fix the errors below")
        } else {
          throw new Error(data.error || "Registration failed")
        }
        return
      }
      onSuccess(data.user)
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = (field?: string) => cn(
    "h-11 w-full rounded-xl border-2 bg-background pl-10 pr-4 text-sm transition-all",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500",
    field && fieldErrors[field] ? "border-red-400" : "border-border"
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {tab === "login" ? "Sign in to continue" : "Create your account"}
              </h2>
              <p className="text-xs text-white/70">
                {tab === "login" ? "Welcome back!" : "Free 30-day trial, no credit card needed"}
              </p>
            </div>
          </div>
          {contextMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs text-white/90">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {contextMessage}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["register", "login"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); resetErrors() }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-all",
                tab === t
                  ? "text-violet-600 border-b-2 border-violet-600 bg-violet-50/50 dark:bg-violet-900/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "register" ? "Create Account" : "Sign In"}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Login Form ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="email" value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                    className={inputCls()} placeholder="you@example.com" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={loginData.password}
                    onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                    className={cn(inputCls(), "pr-10")} placeholder="Your password" required />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 hover:opacity-90 transition-opacity">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? "Signing in..." : "Sign In & Continue"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No account?{" "}
                <button type="button" onClick={() => { setTab("register"); resetErrors() }} className="text-violet-600 font-semibold hover:underline">
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ── Register Form ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[["firstName","First Name","John"],["lastName","Last Name","Doe"]].map(([name, label, ph]) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-sm font-medium">{label}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="text" value={(regData as any)[name]}
                        onChange={e => { setRegData(p => ({ ...p, [name]: e.target.value })); if (fieldErrors[name]) setFieldErrors(p => { const n = {...p}; delete n[name]; return n }) }}
                        className={inputCls(name)} placeholder={ph} required />
                    </div>
                    {fieldErrors[name] && <p className="text-xs text-red-500">{fieldErrors[name]}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="email" value={regData.email}
                    onChange={e => { setRegData(p => ({ ...p, email: e.target.value })); if (fieldErrors.email) setFieldErrors(p => { const n = {...p}; delete n.email; return n }) }}
                    className={inputCls("email")} placeholder="you@example.com" required />
                </div>
                {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone <span className="text-muted-foreground text-xs">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="tel" value={regData.phone} onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))}
                    className={inputCls()} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={regData.password}
                    onChange={e => { setRegData(p => ({ ...p, password: e.target.value })); if (fieldErrors.password) setFieldErrors(p => { const n = {...p}; delete n.password; return n }) }}
                    className={cn(inputCls("password"), "pr-10")} placeholder="Min 6 characters" required />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="password" value={regData.confirmPassword}
                    onChange={e => { setRegData(p => ({ ...p, confirmPassword: e.target.value })); if (fieldErrors.confirmPassword) setFieldErrors(p => { const n = {...p}; delete n.confirmPassword; return n }) }}
                    className={inputCls("confirmPassword")} placeholder="Repeat password" required />
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 hover:opacity-90 transition-opacity mt-1">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? "Creating account..." : "Create Account & Continue"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); resetErrors() }} className="text-violet-600 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
