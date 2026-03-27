"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Check, X, Star, Zap, Building2, Crown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, TrendingUp, Shield, Clock, Users, ArrowRight, Award, HelpCircle, Calendar, School
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PaymentModal } from "@/components/pricing/payment-modal"
import { DemoBookingModal } from "@/components/demo/demo-booking-modal"
import { ContactSalesModal } from "@/components/contact/contact-sales-modal"
import api from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
interface Plan {
  id: string
  name: string
  tagline: string
  price: number
  originalPrice: number
  discount: number
  period: string
  popular?: boolean
  features: {
    included: string[]
    excluded?: string[]
  }
  modules: {
    name: string
    included: boolean
    description?: string
  }[]
  limits: {
    schools?: number
    students?: number
    staff?: number
    storage?: string
  }
  support: string
  badge?: string
}

// Module name mapping for display
const MODULE_NAMES: Record<string, string> = {
  student: "Student Management",
  staff: "Staff Management",
  class: "Class Management",
  subject: "Subject Management",
  attendance: "Attendance Tracking",
  exam: "Exam Management",
  result: "Result Management",
  fee: "Fee Management",
  payment: "Payment Tracking",
  library: "Library Management",
  transport: "Transport Management",
  announcements: "Announcements",
  basic_reports: "Basic Reports",
  advanced_reports: "Advanced Reports",
  custom_reports: "Custom Reports Builder",
  ai_analytics: "AI-Powered Analytics",
  advanced_permissions: "Advanced Permissions",
  multi_branch: "Multi-branch Support",
  custom_workflows: "Custom Workflows",
  api_webhooks: "API & Webhooks",
  third_party_integrations: "Third-party Integrations",
}

// All available modules for comparison
const ALL_MODULES = Object.keys(MODULE_NAMES)

const FAQ_ITEMS = [
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI, and bank transfers. All payments are processed securely."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees! All plans include free setup and migration assistance from our team."
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund."
  },
  {
    question: "Can I get a custom plan?",
    answer: "Yes! Contact our sales team to discuss custom enterprise solutions tailored to your specific needs."
  },
  {
    question: "What happens if I exceed my limits?",
    answer: "We'll notify you before you reach your limits. You can upgrade your plan or purchase additional capacity as needed."
  }
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Auth + payment flow state
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [authedUser, setAuthedUser] = useState<{ id: string; email: string; firstName: string; role: string; schoolId?: string } | null>(null)
  const [schoolName, setSchoolName] = useState("")
  const [showSchoolNamePrompt, setShowSchoolNamePrompt] = useState(false)

  // On mount: check if returning from login/register with ?pay=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldPay = params.get("pay") === "1"
    const planParam = params.get("plan")
    const billingParam = params.get("billing") as "month" | "year" | null

    if (shouldPay && planParam) {
      if (billingParam) setBillingPeriod(billingParam)
      setPendingPlanId(planParam)

      // Clean URL
      const clean = new URL(window.location.href)
      clean.searchParams.delete("pay")
      window.history.replaceState({}, "", clean.toString())

      // Verify still logged in then show school name prompt
      fetch("/api/auth/me", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user) {
            setAuthedUser(data.user)
            setShowSchoolNamePrompt(true)
          } else {
            // Session expired — re-redirect
            const returnUrl = `/pricing?plan=${planParam}&billing=${billingParam || "month"}&pay=1`
            window.location.assign(`/login?redirect=${encodeURIComponent(returnUrl)}`)
          }
        })
        .catch(() => {})
    }
  }, [])

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/plans")
        
        let dbPlans = []
        if (response.data) {
          if (Array.isArray(response.data)) {
            dbPlans = response.data
          } else if (response.data.plans && Array.isArray(response.data.plans)) {
            dbPlans = response.data.plans
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dbPlans = response.data.data
          }
        }

        // Transform database plans to UI format
        const transformedPlans: Plan[] = dbPlans.map((dbPlan: any) => {
          const planModules = dbPlan.modules || []
          const allModulesList = ALL_MODULES.map((moduleId) => ({
            name: MODULE_NAMES[moduleId] || moduleId,
            included: planModules.includes(moduleId),
          }))

          const monthlyPrice = dbPlan.monthlyPrice || 0
          const yearlyPrice = dbPlan.yearlyPrice || 0
          const originalMonthlyPrice = dbPlan.originalMonthlyPrice || monthlyPrice
          const originalYearlyPrice = dbPlan.originalYearlyPrice || yearlyPrice

          return {
            id: dbPlan.slug,
            name: dbPlan.name,
            tagline: dbPlan.tagline || "",
            price: billingPeriod === "month" ? monthlyPrice : yearlyPrice,
            originalPrice: billingPeriod === "month" ? originalMonthlyPrice : originalYearlyPrice,
            discount: dbPlan.discount || 0,
            period: billingPeriod,
            popular: dbPlan.isPopular || false,
            badge: dbPlan.badge || undefined,
            features: {
              included: dbPlan.features || [],
            },
            modules: allModulesList,
            limits: {
              schools: dbPlan.maxSchools || undefined,
              students: dbPlan.maxStudents || undefined,
              staff: dbPlan.maxStaff || undefined,
              storage: dbPlan.storageGB ? `${dbPlan.storageGB} GB` : "Unlimited",
            },
            support: dbPlan.supportLevel === "email"
              ? "Email Support"
              : dbPlan.supportLevel === "priority"
              ? "Priority Support (24/7)"
              : dbPlan.supportLevel === "dedicated"
              ? "Dedicated Support (24/7)"
              : "Premium Support (24/7)",
          }
        })

        setPlans(transformedPlans)
      } catch (error: any) {
        console.error("Failed to fetch plans:", error)
        setPlans([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()
  }, [billingPeriod])

  // Check scroll position
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      checkScroll()
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll)
      }
      window.removeEventListener('resize', checkScroll)
    }
  }, [plans])

  const getPrice = (plan: Plan) => {
    return Math.round(plan.price)
  }

  const getOriginalPrice = (plan: Plan) => {
    return Math.round(plan.originalPrice)
  }

  const handleStartTrial = (planId: string) => {
    // Always go through login page first — no purchase without explicit login
    const returnUrl = `/pricing?plan=${planId}&billing=${billingPeriod}&pay=1`
    window.location.assign(`/login?redirect=${encodeURIComponent(returnUrl)}`)
  }

  const handleSchoolNameConfirm = () => {
    if (!schoolName.trim()) return
    setShowSchoolNamePrompt(false)
    setSelectedPlan(pendingPlanId)
    setIsPaymentModalOpen(true)
  }

  const toggleModules = (planId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }))
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const selectedPlanData = selectedPlan
    ? plans.find((p) => p.id === selectedPlan)
    : null

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "basic":
        return Zap
      case "premium":
        return Star
      case "business":
        return Building2
      case "enterprise":
        return Crown
      default:
        return Sparkles
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-2" />
              Flexible Pricing Plans
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Choose the Perfect Plan
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                for Your School
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Flexible pricing plans designed to grow with your institution. Start free, scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={cn("text-sm font-medium transition-colors", billingPeriod === "month" && "text-primary")}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "month" ? "year" : "month")}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg",
                    billingPeriod === "year" ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className={cn("text-sm font-medium transition-colors", billingPeriod === "year" && "text-primary")}>
                Yearly
              </span>
              {billingPeriod === "year" && (
                <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Save 20%
                </Badge>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <span>24/7 Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plans available at the moment.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Scroll Buttons */}
              {canScrollLeft && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/95 backdrop-blur-sm border-2 border-border rounded-full p-3 shadow-xl hover:bg-background hover:scale-110 transition-all hidden md:flex items-center justify-center"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6 text-foreground" />
                </motion.button>
              )}
              {canScrollRight && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/95 backdrop-blur-sm border-2 border-border rounded-full p-3 shadow-xl hover:bg-background hover:scale-110 transition-all hidden md:flex items-center justify-center"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6 text-foreground" />
                </motion.button>
              )}

              {/* Scrollable Cards Container */}
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory scroll-smooth px-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {plans.map((plan, index) => {
                  const price = getPrice(plan)
                  const originalPrice = getOriginalPrice(plan)
                  const savings = originalPrice - price
                  const Icon = getPlanIcon(plan.id)

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="snap-center flex-shrink-0"
                    >
                      <Card
                        className={cn(
                          "relative flex flex-col transition-all duration-300 hover:shadow-2xl w-[340px] md:w-[380px] h- mt-12",
                          plan.popular && "border-2 border-primary shadow-2xl scale-105 bg-gradient-to-br from-primary/10 via-background to-background ring-2 ring-primary/20"
                        )}
                      >
                        {/* Popular Badge */}
                        {plan.popular && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground px-5 py-1.5 text-sm font-bold shadow-lg">
                              <Award className="h-3 w-3 mr-1.5" />
                              {plan.badge || "MOST POPULAR"}
                            </Badge>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {plan.discount > 0 && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge variant="destructive" className="font-bold shadow-lg animate-pulse">
                              {plan.discount}% OFF
                            </Badge>
                          </div>
                        )}

                        <CardHeader className={cn(
                          "pb-4 pt-6",
                          plan.popular && "bg-gradient-to-br from-primary/5 to-transparent"
                        )}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cn(
                              "p-2.5 rounded-xl",
                              plan.id === "basic" && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                              plan.id === "premium" && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
                              plan.id === "business" && "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
                              plan.id === "enterprise" && "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                            )}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className={cn(
                                "text-2xl font-bold",
                                plan.popular && "bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                              )}>
                                {plan.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col pb-6">
                          {/* Pricing */}
                          <div className="mb-6 pb-6 border-b">
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-4xl font-extrabold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                ₹{price.toLocaleString()}
                              </span>
                              <span className="text-muted-foreground text-lg">/{billingPeriod === "year" ? "year" : "mo"}</span>
                            </div>
                            {originalPrice > price && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{originalPrice.toLocaleString()}
                                </span>
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                  Save ₹{savings.toLocaleString()}
                                </Badge>
                              </div>
                            )}
                            {billingPeriod === "year" && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Just ₹{Math.round(price / 12).toLocaleString()}/month when billed annually
                              </p>
                            )}
                          </div>

                          {/* CTA Button */}
                          <Button
                            onClick={() => handleStartTrial(plan.id)}
                            className={cn(
                              "w-full mb-4 h-12 text-base font-semibold",
                              plan.popular
                                ? "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20"
                                : "bg-background border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            )}
                            size="lg"
                          >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>

                          {plan.id === "premium" && (
                            <Badge variant="secondary" className="w-full justify-center mb-4 py-1.5">
                              <Clock className="h-3 w-3 mr-1.5" />
                              Limited time deal
                            </Badge>
                          )}

                          {/* Limits */}
                          <div className="mb-6 space-y-3 text-sm">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Schools:</span>
                              </div>
                              <span className="font-semibold">
                                {plan.limits.schools === -1 ? "Unlimited" : plan.limits.schools}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Students:</span>
                              </div>
                              <span className="font-semibold">
                                {plan.limits.students === -1 ? "Unlimited" : plan.limits.students?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Staff:</span>
                              </div>
                              <span className="font-semibold">
                                {plan.limits.staff === -1 ? "Unlimited" : plan.limits.staff}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Storage:</span>
                              </div>
                              <span className="font-semibold">{plan.limits.storage}</span>
                            </div>
                          </div>

                          {/* Modules */}
                          <div className="border-t pt-4 mt-auto">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modules Included</p>
                              {plan.modules.length > 5 && (
                                <button
                                  onClick={() => toggleModules(plan.id)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                                >
                                  {expandedModules[plan.id] ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" />
                                      Show Less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" />
                                      Show All ({plan.modules.length})
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className={cn(
                              "space-y-2.5 transition-all duration-300 overflow-hidden",
                              expandedModules[plan.id] ? "max-h-none" : "max-h-64"
                            )}>
                              {plan.modules.map((module, idx) => {
                                const isVisible = expandedModules[plan.id] || idx < 5
                                if (!isVisible) return null
                                
                                return (
                                  <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="flex items-start gap-2.5"
                                  >
                                    {module.included ? (
                                      <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                      </div>
                                    ) : (
                                      <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <X className="h-3 w-3 text-gray-400" />
                                      </div>
                                    )}
                                    <span
                                      className={cn(
                                        "text-sm leading-relaxed",
                                        module.included ? "text-foreground font-medium" : "text-muted-foreground line-through"
                                      )}
                                    >
                                      {module.name}
                                    </span>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Support */}
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Shield className="h-3.5 w-3.5" />
                              <span className="font-medium">{plan.support}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-2" />
              What&apos;s Included
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All plans include these essential features to help you manage your school efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and security protocols to keep your data safe"
              },
              {
                icon: Clock,
                title: "Automatic Backups",
                description: "Daily automated backups ensure your data is always protected"
              },
              {
                icon: Users,
                title: "Free Migration",
                description: "Our team will help you migrate your data for free with zero downtime"
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20">
              <HelpCircle className="h-3 w-3 mr-2" />
              Frequently Asked Questions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Got Questions? We&apos;ve Got Answers
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-semibold text-lg pr-4">{faq.question}</span>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-6 px-6">
                          <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent_70%)]" />
            <CardContent className="relative p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Still Not Sure Which Plan to Choose?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Schedule a free demo with our team and we&apos;ll help you find the perfect plan for your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule a Demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsContactSalesOpen(true)}
                  className="h-12 px-8 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                >
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* School Name Prompt — shown after auth, before payment */}
      {showSchoolNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-500 p-2.5 rounded-xl">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Name your school</h3>
                <p className="text-xs text-muted-foreground">You can change this later in settings</p>
              </div>
            </div>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSchoolNameConfirm()}
              placeholder="e.g. Greenwood Academy"
              className="w-full h-11 rounded-xl border-2 border-border bg-background px-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSchoolNamePrompt(false)}
                className="flex-1 h-10 rounded-xl border-2 border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchoolNameConfirm}
                disabled={!schoolName.trim()}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                Continue to Payment →
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanData && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={(open) => { if (!open) { setIsPaymentModalOpen(false); setSelectedPlan(null) } }}
          plan={{
            id: selectedPlanData.id,
            name: selectedPlanData.name,
            price: getPrice(selectedPlanData),
            period: billingPeriod,
          }}
          schoolName={schoolName}
          billingPeriod={billingPeriod}
        />
      )}

      {/* Demo Booking Modal */}
      <DemoBookingModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />

      {/* Contact Sales Modal */}
      <ContactSalesModal open={isContactSalesOpen} onOpenChange={setIsContactSalesOpen} />
    </div>
  )
}
