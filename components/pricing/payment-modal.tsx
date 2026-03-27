"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Lock, 
  Shield, 
  Check, 
  CreditCard, 
  Building2,
  Smartphone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: {
    id: string
    name: string
    price: number
    period: string
  }
  schoolName: string
  billingPeriod: "month" | "year"
  onPaymentSuccess?: () => void
}

type PaymentMethod = "upi" | "card" | "netbanking"

interface PaymentMethodOption {
  id: PaymentMethod
  name: string
  icon: React.ReactNode
  description: string
  color: string
  bgColor: string
}

// UPI Apps Icons
const UPIIcons = () => (
  <div className="flex items-center gap-1.5">
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center text-white text-xs font-bold">
      G
    </div>
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5F259F] to-[#7B2CBF] flex items-center justify-center text-white text-xs font-bold">
      P
    </div>
    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00BAF2] to-[#00A8E8] flex items-center justify-center text-white text-xs font-bold">
      P
    </div>
  </div>
)

// Card Brand Icons
const VisaIcon = () => (
  <div className="h-6 w-10 bg-gradient-to-r from-[#1434CB] to-[#1A1F71] rounded flex items-center justify-center">
    <span className="text-white text-[10px] font-bold">VISA</span>
  </div>
)

const MastercardIcon = () => (
  <div className="h-6 w-10 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded-full flex items-center justify-center relative overflow-hidden">
    <div className="absolute left-0 top-0 h-full w-1/2 bg-[#EB001B] rounded-l-full"></div>
    <div className="absolute right-0 top-0 h-full w-1/2 bg-[#F79E1B] rounded-r-full"></div>
  </div>
)

const CardIcon = () => (
  <div className="flex items-center gap-2">
    <VisaIcon />
    <MastercardIcon />
    <div className="h-6 w-6 rounded border-2 border-gray-300 flex items-center justify-center">
      <CreditCard className="h-3 w-3 text-gray-400" />
    </div>
  </div>
)

const BankIcon = () => (
  <div className="flex items-center gap-2">
    <Building2 className="h-6 w-6 text-blue-600" />
    <span className="text-xs font-medium text-gray-600">Banks</span>
  </div>
)

export function PaymentModal({ open, onOpenChange, plan, schoolName, billingPeriod, onPaymentSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  })
  const [upiId, setUpiId] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [cardType, setCardType] = useState<"visa" | "mastercard" | "unknown">("unknown")

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "upi",
      name: "UPI",
      icon: <UPIIcons />,
      description: "GPay, PhonePe, Paytm",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "card",
      name: "Card",
      icon: <CardIcon />,
      description: "Debit / Credit",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "netbanking",
      name: "Net Banking",
      icon: <BankIcon />,
      description: "SBI, HDFC, ICICI",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ]

  const gstAmount = Math.round(plan.price * 0.18)
  const totalAmount = plan.price + gstAmount

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    
    // Detect card type
    if (match.startsWith("4")) {
      setCardType("visa")
    } else if (match.startsWith("5") || match.startsWith("2")) {
      setCardType("mastercard")
    } else {
      setCardType("unknown")
    }
    
    return parts.length ? parts.join(" ") : v
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardData({ ...cardData, number: formatted })
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value)
    setCardData({ ...cardData, expiry: formatted })
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // Simulate payment processing (replace with real gateway in production)
      await new Promise((resolve) => setTimeout(resolve, 1800))

      const txId = `TXN${Date.now()}`

      // Call subscribe API to create school + assign admin role + send email
      const res = await fetch("/api/auth/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.id,
          billingPeriod,
          amount: totalAmount,
          paymentMethod,
          transactionId: txId,
          schoolName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed")
      }

      if (onPaymentSuccess) onPaymentSuccess()
      onOpenChange(false)

      // Redirect to dashboard with fresh token cookie already set by API
      window.location.assign(data.redirectTo || "/dashboard")
    } catch (err: any) {
      console.error("[payment] error:", err)
      // Show error in UI — re-use the AlertCircle pattern already in the modal
      alert(err.message || "Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const isFormValid = () => {
    if (paymentMethod === "card") {
      return (
        cardData.number.replace(/\s/g, "").length >= 16 &&
        cardData.expiry.length === 5 &&
        cardData.cvv.length >= 3 &&
        cardData.name.length >= 3
      )
    }
    if (paymentMethod === "upi") {
      return upiId.includes("@") && upiId.length > 5
    }
    if (paymentMethod === "netbanking") {
      return selectedBank.length > 0
    }
    return false
  }

  const getCardGradient = () => {
    if (cardType === "visa") {
      return "from-[#1434CB] to-[#1A1F71]"
    } else if (cardType === "mastercard") {
      return "from-[#EB001B] to-[#F79E1B]"
    }
    return "from-gray-700 to-gray-900"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl bg-background">
        {/* Header with Gradient */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Secure Payment</h2>
                <p className="text-xs text-muted-foreground">Powered by Codeat ERP</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Shield className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Secure</span>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 border-b">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
              <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent tracking-tight">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{plan.price.toLocaleString()} + ₹{gstAmount.toLocaleString()} GST
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6 max-h-[calc(100vh-450px)] overflow-y-auto bg-muted/30">
          {/* Payment Methods */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-4 block">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const isActive = paymentMethod === method.id
                return (
                  <motion.button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex flex-col items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all duration-200",
                      isActive
                        ? `border-primary bg-gradient-to-br ${method.bgColor} shadow-lg shadow-primary/20`
                        : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("transition-all duration-200", isActive ? method.color : "text-muted-foreground")}>
                      {method.icon}
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          "text-xs font-semibold transition-colors duration-200",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {method.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{method.description}</p>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="h-5 w-5 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center shadow-lg">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Payment Forms */}
          <AnimatePresence mode="wait">
            {/* UPI Form */}
            {paymentMethod === "upi" && (
              <motion.div
                key="upi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@paytm"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base font-medium"
                  />
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    You&apos;ll be redirected to your UPI app to complete the payment securely
                  </p>
                </div>
              </motion.div>
            )}

            {/* Card Form */}
            {paymentMethod === "card" && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Card Preview */}
                <div className={`relative h-44 rounded-2xl bg-gradient-to-br ${getCardGradient()} p-6 text-white shadow-xl overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-12 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                        {cardType === "visa" ? (
                          <span className="text-white text-xs font-bold">VISA</span>
                        ) : cardType === "mastercard" ? (
                          <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-[#EB001B]"></div>
                            <div className="h-3 w-3 rounded-full bg-[#F79E1B] -ml-1"></div>
                          </div>
                        ) : (
                          <CreditCard className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="text-xs font-medium opacity-80">Chip</div>
                    </div>
                    <div>
                      <div className="text-lg font-mono tracking-wider mb-2">
                        {cardData.number || "•••• •••• •••• ••••"}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-70 mb-1">Cardholder</div>
                          <div className="text-sm font-medium">{cardData.name || "YOUR NAME"}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-70 mb-1">Expires</div>
                          <div className="text-sm font-medium">{cardData.expiry || "MM/YY"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Card Number</label>
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Expiry Date</label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">CVV</label>
                    <input
                      type="password"
                      value={cardData.cvv}
                      onChange={(e) =>
                        setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base"
                  />
                </div>
              </motion.div>
            )}

            {/* Net Banking Form */}
            {paymentMethod === "netbanking" && (
              <motion.div
                key="netbanking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Select Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base font-medium appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
                  >
                    <option value="">Choose your bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="pnb">Punjab National Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="other">Other Bank</option>
                  </select>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    You&apos;ll be redirected to your bank&apos;s secure payment page
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t bg-background space-y-4">
          {/* Security Badges */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>PCI DSS</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <span>Secure</span>
            </div>
          </div>

          {/* Pay Button */}
          <motion.button
            onClick={handlePayment}
            disabled={!isFormValid() || isProcessing}
            whileHover={isFormValid() && !isProcessing ? { scale: 1.02 } : {}}
            whileTap={isFormValid() && !isProcessing ? { scale: 0.98 } : {}}
            className={cn(
              "w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 relative overflow-hidden",
              "bg-gradient-to-r from-primary to-purple-600 text-white",
              "hover:shadow-xl hover:shadow-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Pay ₹{totalAmount.toLocaleString("en-IN")}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </motion.button>

          {/* Cancel Button */}
          <button
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
