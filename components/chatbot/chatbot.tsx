"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Send, Bot, User, Minimize2, Maximize2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// ─── Knowledge Base ────────────────────────────────────────────────────────────
// Each entry: keywords to match (lowercase), and the answer to return.
const KB: { keys: string[]; answer: string }[] = [
  // ── General / About ──────────────────────────────────────────────────────────
  {
    keys: ["what is", "about", "codeat", "erp", "platform", "system", "this app", "this website"],
    answer:
      "Codeat ERP is a multi-tenant management platform for schools, companies, trusts, and NGOs.\n\nCore modules:\n• 👥 People — Students, Staff, CRM & Contacts\n• 🏫 Academic — Classes, Sections, Subjects\n• 📝 Exams & Results\n• ✅ Attendance\n• 💰 Fees & Payments\n• 📚 Library\n• 🚌 Transport\n• 📢 Announcements\n• 📊 Reports\n• 🔧 ERP Hub — Inventory, Projects, Documents\n• 🔐 Roles & Permissions\n• 🌐 Multi-language (23 Indian languages + English)\n\nEvery organization (tenant) is fully isolated — data never leaks between tenants.",
  },
  {
    keys: ["feature", "capabilities", "what can", "modules"],
    answer:
      "Codeat ERP features at a glance:\n\n📚 Academic — Classes, Subjects, Exams, Results\n👥 People — Students, Staff, Parents\n💰 Finance — Fees, Payments, Receipts\n✅ Attendance — Students & Staff\n📚 Library — Books, Issues, Returns\n🚌 Transport — Routes, Stops, Assignments\n📢 Announcements — Targeted by role/audience\n📊 Reports & Analytics\n🔧 ERP Hub — CRM, Inventory, Projects, Documents\n🔐 RBAC — Custom roles with granular permissions\n🌐 23 languages supported\n🎨 Per-tenant theme (colors, logo, favicon)\n\nAsk about any specific module for details!",
  },

  // ── Login / Auth ─────────────────────────────────────────────────────────────
  {
    keys: ["login", "sign in", "how to login", "access", "credentials"],
    answer:
      "To sign in:\n1. Go to /login\n2. Enter your email and password\n3. Click 'Sign In'\n\nYou can also use 'Continue with Google' if Google OAuth is configured.\n\nDefault Super Admin:\n• Email: admin@school.com\n• Password: admin123\n\nOther users get credentials from their school administrator.\n\nAfter login, super admins land on /admin/super and all other users land on /dashboard.",
  },
  {
    keys: ["forgot password", "reset password", "otp", "forgot"],
    answer:
      "To reset your password:\n1. Click 'Forgot password?' on the login page\n2. Enter your registered email — a 6-digit OTP is sent\n3. Enter the OTP (valid for 10 minutes)\n4. Set your new password (min 8 characters)\n\nIf SMTP is not configured, the OTP is printed to the server console (dev mode).\n\nRoute: /forgot-password",
  },
  {
    keys: ["logout", "sign out"],
    answer:
      "To logout:\n• Click your avatar/name in the top navigation bar\n• Select 'Logout' from the dropdown\n\nYour session cookie is cleared and you are redirected to /login.",
  },
  {
    keys: ["google", "oauth", "google login", "social login"],
    answer:
      "Google OAuth is supported. To use it:\n1. Click 'Continue with Google' on the login page\n2. Authorize the app in the Google popup\n3. You'll be redirected back and logged in automatically\n\nFor setup, configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.\nCallback URL: /api/auth/google/callback\n\nDebug endpoint: /api/auth/google/debug",
  },
  {
    keys: ["register", "sign up", "create account"],
    answer:
      "New organization registration:\n1. Go to /register\n2. Fill in your organization details and admin credentials\n3. Submit — a new tenant + admin account is created\n\nIndividual users (staff, teachers, etc.) are created by the school admin from the dashboard, not via self-registration.",
  },

  // ── Super Admin ──────────────────────────────────────────────────────────────
  {
    keys: ["super admin", "superadmin", "super admin panel", "admin panel"],
    answer:
      "The Super Admin panel is at /admin/super and has 4 sections:\n\n1. Dashboard — Overview stats (schools, users, plans)\n2. Admins — Create/manage admin users across all tenants\n3. Roles & Permissions — Create roles, assign permissions\n4. Plans — Manage subscription plans\n5. Schools — View and manage all tenant organizations\n\nOnly users with the 'super_admin' role can access this area.",
  },
  {
    keys: ["create admin", "add admin", "new admin"],
    answer:
      "To create a new admin:\n1. Login as Super Admin\n2. Go to /admin/super → Admins tab\n3. Click 'Create Admin'\n4. Fill in: First Name, Last Name, Email, Password, Role, School (optional)\n5. Click 'Create Admin'\n\nA welcome email is sent if SMTP is configured. The admin can then login at /login.",
  },
  {
    keys: ["school", "tenant", "organization", "create school", "add school"],
    answer:
      "Schools (tenants) are managed by the Super Admin:\n• View all schools at /admin/super → Schools\n• Each school has: name, slug, type (school/company/trust/NGO), plan, status\n• School admins manage their own data in isolation\n• Organization type drives ERP labels (e.g. 'Students' vs 'Members')\n\nTo create a school, use the 'Create School' button in the Schools tab.",
  },
  {
    keys: ["plan", "subscription", "pricing", "billing"],
    answer:
      "Subscription plans are managed at /admin/super → Plans.\n\nEach plan has:\n• Name, slug, monthly/yearly price\n• Module access (which ERP modules are included)\n• Limits: max students, staff, storage\n• Support level: email / priority / dedicated\n\nPublic pricing page is at /pricing.\nPayment modal handles plan upgrades.",
  },

  // ── Roles & Permissions ──────────────────────────────────────────────────────
  {
    keys: ["role", "permission", "rbac", "access control", "manage permission"],
    answer:
      "Codeat ERP uses Role-Based Access Control (RBAC).\n\nBuilt-in roles:\n• super_admin — full access to everything\n• school_admin — full access within their tenant\n• principal — read-only across all modules + announcements\n• teacher — classes, exams, results, attendance\n• student — read own data\n• parent — read child's data\n• accountant — fees, payments, reports\n• hr_manager — staff, attendance\n• librarian — library module\n• transport_manager — transport module\n\nTo manage permissions:\n1. Go to /admin/super → Roles\n2. Click 'Manage Permissions' on a role\n3. Toggle permissions on/off\n4. Save — all users with that role are updated instantly",
  },
  {
    keys: ["permission list", "all permissions", "what permissions"],
    answer:
      "Available permissions by module:\n\n👤 User: create, read, update, delete\n🏫 School: create, read, update, delete\n🎓 Student: create, read, update, delete\n👨‍🏫 Staff: create, read, update, delete\n📚 Class: create, read, update, delete\n📖 Subject: create, read, update, delete\n📝 Exam: create, read, update, delete\n📊 Result: create, read, update, delete\n✅ Attendance: create, read, update\n💰 Fee: create, read, update, delete\n💳 Payment: create, read, update\n📚 Library: create, read, update, delete\n🚌 Transport: create, read, update, delete\n📢 Announcement: create, read, update, delete\n📈 Report: read, export\n⚙️ Settings: read, update\n🔧 ERP: read, write",
  },

  // ── Dashboard ────────────────────────────────────────────────────────────────
  {
    keys: ["dashboard", "home", "overview", "stats"],
    answer:
      "The main dashboard (/dashboard) shows:\n• Total Students, Staff, Classes, Revenue\n• Today's attendance summary\n• Pending payments\n• Recent announcements\n• Quick navigation to all modules\n\nStats are fetched from /api/dashboard/stats and are scoped to the logged-in user's school.",
  },

  // ── Students ─────────────────────────────────────────────────────────────────
  {
    keys: ["student", "pupil", "admission", "enroll"],
    answer:
      "Student Management (/dashboard/students):\n\n• Add students with admission number, personal info, class/section\n• Search by name, email, admission number\n• Filter by class, section, status (active/graduated/transferred)\n• View detailed profile: attendance, results, fees\n• Edit or deactivate students\n• Stats cards: total, active, new this month\n\nAPI: GET/POST /api/students, GET/PUT/DELETE /api/students/[id]\nStats: /api/students/stats",
  },
  {
    keys: ["admission number", "student id"],
    answer:
      "Each student has a unique admission number within their school. It's set when creating the student and used for identification across modules (attendance, fees, results).\n\nFormat is flexible — you can use numeric (001, 002) or alphanumeric (2024-001) formats.",
  },

  // ── Staff ────────────────────────────────────────────────────────────────────
  {
    keys: ["staff", "teacher", "employee", "hr", "personnel"],
    answer:
      "Staff Management (/dashboard/staff):\n\n• Add staff: name, employee ID, designation, department, salary\n• Designations: Teacher, Principal, Accountant, HR, Librarian, Transport Manager\n• Assign to classes and subjects\n• Track staff attendance\n• View staff stats: total, active, by designation\n• Edit or deactivate staff\n\nAPI: GET/POST /api/staff, GET/PUT/DELETE /api/staff/[id]\nStats: /api/staff/stats",
  },

  // ── Classes & Subjects ───────────────────────────────────────────────────────
  {
    keys: ["class", "grade", "section", "classroom"],
    answer:
      "Class Management (/dashboard/classes):\n\n• Create classes (Grade 1, Class 10, etc.) with capacity\n• Add sections (A, B, C) to each class\n• Assign a class teacher\n• View enrolled students per class\n• Stats: total classes, total sections, avg capacity\n\nAPI: GET/POST /api/classes, GET/PUT/DELETE /api/classes/[id]\nSections: /api/classes/[id]/sections",
  },
  {
    keys: ["subject", "course", "curriculum"],
    answer:
      "Subject Management (/dashboard/subjects):\n\n• Create subjects with name, code, credits\n• Link subjects to classes\n• Assign a teacher to each subject\n• Subjects are used in exams and results\n\nAPI: GET/POST /api/subjects, GET/PUT/DELETE /api/subjects/[id]",
  },

  // ── Exams & Results ──────────────────────────────────────────────────────────
  {
    keys: ["exam", "test", "assessment", "quiz"],
    answer:
      "Exam Management (/dashboard/exams):\n\n• Create exams: name, type (mid_term/final/quiz/assignment), class, date range\n• Exam statuses: scheduled → ongoing → completed → cancelled\n• Link exams to specific classes\n• Teachers can create and update exams\n\nAPI: GET/POST /api/exams, GET/PUT/DELETE /api/exams/[id]",
  },
  {
    keys: ["result", "marks", "grade", "score", "performance"],
    answer:
      "Results Management (/dashboard/results):\n\n• Enter marks per student per subject per exam\n• Grades are calculated automatically\n• View performance analytics\n• Filter by class, exam, student\n• Export results\n\nAPI: GET/POST /api/results, GET/PUT/DELETE /api/results/[id]",
  },

  // ── Attendance ───────────────────────────────────────────────────────────────
  {
    keys: ["attendance", "present", "absent", "late", "mark attendance"],
    answer:
      "Attendance Management (/dashboard/attendance):\n\n• Mark daily attendance: present / absent / late / excused\n• Track both student and staff attendance\n• View attendance by date, class, student\n• Attendance reports and summaries\n• Identify patterns (chronic absentees)\n\nAPI: GET/POST /api/attendance, GET/PUT/DELETE /api/attendance/[id]",
  },

  // ── Fees & Payments ──────────────────────────────────────────────────────────
  {
    keys: ["fee", "fees", "fee structure", "tuition"],
    answer:
      "Fee Management (/dashboard/fees):\n\n• Create fee types: name, amount, frequency (monthly/quarterly/yearly/one-time)\n• Link fees to specific classes\n• Set due dates\n• Track which students have paid\n\nAPI: GET/POST /api/fees, GET/PUT/DELETE /api/fees/[id]",
  },
  {
    keys: ["payment", "pay", "receipt", "transaction", "due", "outstanding"],
    answer:
      "Payment Management (/dashboard/payments):\n\n• Record payments: cash, card, bank transfer, online\n• Link payment to student + fee\n• Payment statuses: pending / completed / failed / refunded\n• Generate receipts\n• Track outstanding dues\n• Financial reports\n\nAPI: GET/POST /api/payments, GET/PUT/DELETE /api/payments/[id]",
  },

  // ── Library ──────────────────────────────────────────────────────────────────
  {
    keys: ["library", "book", "isbn", "issue book", "return book"],
    answer:
      "Library Management (/dashboard/library):\n\n• Add books: title, author, ISBN, category, copies\n• Issue books to students or staff\n• Track due dates and returns\n• Overdue book alerts\n• Fine management\n• Book statuses: available / issued / lost / damaged\n\nAPI: GET/POST /api/library/books, GET/PUT/DELETE /api/library/books/[id]",
  },

  // ── Transport ────────────────────────────────────────────────────────────────
  {
    keys: ["transport", "bus", "route", "vehicle", "driver"],
    answer:
      "Transport Management (/dashboard/transport):\n\n• Create routes: name, route number, start/end points, stops\n• Set fare per route\n• Assign students to routes with pickup/drop points\n• Track distance and vehicle info\n• Route statuses: active / inactive\n\nAPI: /api/transport/routes",
  },

  // ── Announcements ────────────────────────────────────────────────────────────
  {
    keys: ["announcement", "notice", "notification", "broadcast"],
    answer:
      "Announcements (/dashboard/announcements):\n\n• Create announcements with title, content, type\n• Types: general / academic / event / emergency\n• Priority: low / normal / high / urgent\n• Target specific audiences (by role) or 'all'\n• Schedule with start/end dates\n• Publish/unpublish control\n\nAPI: GET/POST /api/announcements, GET/PUT/DELETE /api/announcements/[id]",
  },
  {
    keys: ["notification", "bell", "alert"],
    answer:
      "In-app notifications appear in the bell icon in the top navigation.\n• Fetched from /api/notifications\n• Shows unread count badge\n• Click to view all notifications\n\nAnnouncements are separate from notifications — they're managed in the Announcements module.",
  },

  // ── Reports ──────────────────────────────────────────────────────────────────
  {
    keys: ["report", "analytics", "export", "download"],
    answer:
      "Reports (/dashboard/reports):\n\n• Student reports: enrollment, performance, attendance\n• Staff reports: headcount, attendance, payroll\n• Financial reports: fee collection, outstanding dues, payment history\n• Academic reports: exam results, class performance\n• Export to CSV/PDF\n\nAPI: /api/reports/stats\nRequires: report:read permission",
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  {
    keys: ["setting", "settings", "profile", "account", "preference"],
    answer:
      "Settings (/dashboard/settings):\n\n• Update your profile: name, phone, avatar\n• Change password\n• Language preference (23 languages)\n• Timezone\n• Organization settings (admin only): logo, colors, favicon, default language\n\nAPI: GET/PUT /api/settings",
  },
  {
    keys: ["language", "multilingual", "translate", "hindi", "regional"],
    answer:
      "Codeat ERP supports 23 languages:\nEnglish, Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Nepali, Odia, Punjabi, Tamil, Telugu, Urdu, Assamese, Bodo, Dogri, Kashmiri, Konkani, Maithili, Manipuri, Sanskrit, Santali, Sindhi\n\nTo change language:\n• Go to Settings → Language\n• Or use the language selector in the top navigation\n• Language is saved per user account",
  },
  {
    keys: ["theme", "color", "logo", "branding", "customize"],
    answer:
      "Each tenant can customize their branding:\n• Primary, secondary, accent colors\n• Logo URL\n• Favicon URL\n\nThese are set in School settings (admin only) and apply across the entire tenant's dashboard.\n\nThe theme config is in lib/theme-config.ts and applied via CSS variables.",
  },

  // ── ERP Hub ──────────────────────────────────────────────────────────────────
  {
    keys: ["erp", "erp hub", "crm", "inventory", "project", "document"],
    answer:
      "ERP Hub (/dashboard/erp) extends the platform beyond schools:\n\n• CRM & Contacts (/dashboard/crm) — manage leads, contacts, relationships\n• Inventory (/dashboard/inventory) — track assets and stock\n• Projects (/dashboard/projects) — project management\n• Documents (/dashboard/documents) — document storage and management\n\nRequires: erp:read / erp:write permissions\nAvailable to: school_admin, principal, accountant, hr_manager, librarian, transport_manager",
  },

  // ── Navigation ───────────────────────────────────────────────────────────────
  {
    keys: ["navigate", "menu", "sidebar", "where", "find", "go to"],
    answer:
      "Navigation guide:\n\n• Sidebar (left) — all modules you have permission to access\n• Top bar — notifications bell, language selector, theme, profile menu\n• Super Admin link — only visible to super_admin role\n• Each module is a separate page under /dashboard/[module]\n\nIf a menu item is missing, you may not have the required permission. Contact your admin.",
  },

  // ── API ──────────────────────────────────────────────────────────────────────
  {
    keys: ["api", "endpoint", "rest", "backend"],
    answer:
      "All APIs are under /api/:\n\n• /api/auth/login — POST login\n• /api/auth/register — POST register\n• /api/auth/me — GET current user\n• /api/auth/logout — POST logout\n• /api/auth/forgot-password — POST send OTP\n• /api/auth/verify-otp — POST verify OTP\n• /api/auth/reset-password — POST reset password\n• /api/students — CRUD\n• /api/staff — CRUD\n• /api/classes — CRUD\n• /api/subjects — CRUD\n• /api/exams — CRUD\n• /api/results — CRUD\n• /api/attendance — CRUD\n• /api/fees — CRUD\n• /api/payments — CRUD\n• /api/library/books — CRUD\n• /api/transport/routes — CRUD\n• /api/announcements — CRUD\n• /api/reports/stats — GET\n• /api/dashboard/stats — GET\n• /api/admin/* — Super admin only",
  },

  // ── Tech Stack ───────────────────────────────────────────────────────────────
  {
    keys: ["tech", "technology", "stack", "built with", "framework", "nextjs", "prisma", "database"],
    answer:
      "Tech stack:\n\n• Framework: Next.js 14 (App Router)\n• Language: TypeScript\n• Database: MySQL via Prisma ORM\n• Auth: JWT (httpOnly cookies) + Google OAuth\n• Styling: Tailwind CSS + shadcn/ui\n• Email: Nodemailer (SMTP)\n• Deployment: Docker / Vercel compatible\n\nKey files:\n• prisma/schema.prisma — DB schema\n• lib/auth.ts — JWT auth\n• lib/permissions.ts — RBAC\n• middleware.ts — route protection",
  },

  // ── Setup / Install ──────────────────────────────────────────────────────────
  {
    keys: ["install", "setup", "env", "environment", "docker", "deploy", "quickstart"],
    answer:
      "Quick setup:\n1. Copy env.example → .env and fill in values\n2. Set DATABASE_URL (MySQL)\n3. Set JWT_SECRET\n4. Set SMTP_* for email (optional)\n5. Run: npx prisma migrate deploy\n6. Run: npx prisma db seed\n7. Run: npm run dev\n\nDocker: docker-compose up\n\nSee QUICKSTART.md, INSTALL_GUIDE.md, and ENV_SETUP.md for full details.",
  },

  // ── Greetings ────────────────────────────────────────────────────────────────
  {
    keys: ["hello", "hi", "hey", "good morning", "good afternoon", "greet"],
    answer:
      "Hey! 👋 I'm the Codeat ERP assistant.\n\nI can help you with:\n• How to use any module (students, fees, exams, etc.)\n• Login, roles & permissions\n• Super admin tasks\n• API endpoints\n• Setup & configuration\n\nWhat would you like to know?",
  },
  {
    keys: ["thank", "thanks", "thank you", "great", "awesome", "helpful"],
    answer: "Happy to help! Feel free to ask anything else about Codeat ERP. 😊",
  },
  {
    keys: ["bye", "goodbye", "see you", "exit"],
    answer: "Goodbye! Come back anytime if you have questions. 👋",
  },
]

// ─── Matcher ──────────────────────────────────────────────────────────────────
function getAnswer(input: string): string {
  const lower = input.toLowerCase().trim()

  // Score each KB entry by how many keywords match
  let bestScore = 0
  let bestAnswer = ""

  for (const entry of KB) {
    let score = 0
    for (const key of entry.keys) {
      if (lower.includes(key)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestAnswer = entry.answer
    }
  }

  if (bestScore > 0) return bestAnswer

  // Fallback
  return `I'm not sure about "${input}" specifically.\n\nI can help with:\n• Login & authentication\n• Students, Staff, Classes, Subjects\n• Exams & Results\n• Attendance, Fees, Payments\n• Library, Transport, Announcements\n• Roles & Permissions\n• Super Admin tasks\n• Reports & Settings\n• ERP Hub (CRM, Inventory, Projects)\n• API endpoints & tech stack\n\nTry asking something like:\n• "How do I add a student?"\n• "How do permissions work?"\n• "What is the ERP hub?"\n• "How to reset password?"`
}

// ─── Suggested questions shown on first open ──────────────────────────────────
const SUGGESTED: string[] = [
  "What modules does this system have?",
  "How do I login?",
  "How do permissions work?",
  "How to add a student?",
  "How to manage fees?",
  "What is the ERP hub?",
  "How to reset password?",
  "Tell me about exam management",
]

// ─── Component ────────────────────────────────────────────────────────────────
export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! 👋 I'm your Codeat ERP assistant.\n\nAsk me anything about how to use this platform — modules, permissions, setup, APIs, and more.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) inputRef.current?.focus()
  }, [isOpen, isMinimized])

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    // Simulate a short thinking delay for UX
    await new Promise((r) => setTimeout(r, 400))

    const answer = getAnswer(content)
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: "assistant", content: answer, timestamp: new Date() },
    ])
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showSuggestions = messages.length === 1

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card
          className={cn(
            "fixed bottom-6 right-6 z-50 flex w-[380px] flex-col border-2 shadow-2xl transition-all duration-200",
            isMinimized ? "h-auto" : "h-[600px] max-h-[85vh]"
          )}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3 pt-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold leading-none">ERP Assistant</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Codeat ERP Help</p>
              </div>
              <span className="ml-1 flex h-2 w-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-7 w-7 p-0">
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-7 w-7 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm",
                        msg.role === "user"
                          ? "rounded-tr-sm bg-primary text-primary-foreground"
                          : "rounded-tl-sm bg-muted text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className="mt-1 text-[10px] opacity-60">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                        <User className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Suggested questions */}
              {showSuggestions && (
                <div className="border-t px-4 py-3">
                  <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    Suggested questions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/40"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about Codeat ERP..."
                    disabled={isLoading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  )
}
