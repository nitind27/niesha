import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken, verifyToken } from "@/lib/auth"
import { authCookieOptions } from "@/lib/auth-cookies"
import { sendSubscriptionWelcomeEmail, appBaseUrl } from "@/lib/mail"
import { z } from "zod"
import { PERMISSIONS, ROLE_PERMISSIONS, Permission } from "@/lib/permissions"

const subscribeSchema = z.object({
  planSlug: z.string().min(1),
  billingPeriod: z.enum(["month", "year"]),
  amount: z.number().min(0),
  paymentMethod: z.string().min(1),
  transactionId: z.string().optional(),
  schoolName: z.string().min(1, "School name is required").max(255),
})

// Map plan modules → which permissions they unlock
const MODULE_PERMISSIONS: Record<string, Permission[]> = {
  student:       [PERMISSIONS.STUDENT_CREATE, PERMISSIONS.STUDENT_READ, PERMISSIONS.STUDENT_UPDATE, PERMISSIONS.STUDENT_DELETE],
  staff:         [PERMISSIONS.STAFF_CREATE, PERMISSIONS.STAFF_READ, PERMISSIONS.STAFF_UPDATE, PERMISSIONS.STAFF_DELETE],
  class:         [PERMISSIONS.CLASS_CREATE, PERMISSIONS.CLASS_READ, PERMISSIONS.CLASS_UPDATE, PERMISSIONS.CLASS_DELETE],
  subject:       [PERMISSIONS.SUBJECT_CREATE, PERMISSIONS.SUBJECT_READ, PERMISSIONS.SUBJECT_UPDATE, PERMISSIONS.SUBJECT_DELETE],
  attendance:    [PERMISSIONS.ATTENDANCE_CREATE, PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.ATTENDANCE_UPDATE],
  exam:          [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_READ, PERMISSIONS.EXAM_UPDATE, PERMISSIONS.EXAM_DELETE],
  result:        [PERMISSIONS.RESULT_CREATE, PERMISSIONS.RESULT_READ, PERMISSIONS.RESULT_UPDATE, PERMISSIONS.RESULT_DELETE],
  fee:           [PERMISSIONS.FEE_CREATE, PERMISSIONS.FEE_READ, PERMISSIONS.FEE_UPDATE, PERMISSIONS.FEE_DELETE],
  payment:       [PERMISSIONS.PAYMENT_CREATE, PERMISSIONS.PAYMENT_READ, PERMISSIONS.PAYMENT_UPDATE],
  library:       [PERMISSIONS.LIBRARY_CREATE, PERMISSIONS.LIBRARY_READ, PERMISSIONS.LIBRARY_UPDATE, PERMISSIONS.LIBRARY_DELETE],
  transport:     [PERMISSIONS.TRANSPORT_CREATE, PERMISSIONS.TRANSPORT_READ, PERMISSIONS.TRANSPORT_UPDATE, PERMISSIONS.TRANSPORT_DELETE],
  announcements: [PERMISSIONS.ANNOUNCEMENT_CREATE, PERMISSIONS.ANNOUNCEMENT_READ, PERMISSIONS.ANNOUNCEMENT_UPDATE, PERMISSIONS.ANNOUNCEMENT_DELETE],
  basic_reports: [PERMISSIONS.REPORT_READ],
  advanced_reports: [PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT],
  custom_reports:   [PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT],
  ai_analytics:     [PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT],
  advanced_permissions: [],
  multi_branch:  [],
  custom_workflows: [],
  api_webhooks:  [],
  third_party_integrations: [],
}

// Roles to create per school — permissions filtered by what the plan allows
const SCHOOL_ROLES = [
  {
    name: "school_admin",
    displayName: "School Admin",
    description: "Full access to all school modules",
    // Gets ALL permissions from plan modules + settings
    extra: [PERMISSIONS.SCHOOL_READ, PERMISSIONS.SCHOOL_UPDATE, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE, PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.ERP_READ, PERMISSIONS.ERP_WRITE],
    allModules: true,
  },
  {
    name: "principal",
    displayName: "Principal",
    description: "Read access to all modules, can manage announcements",
    readOnly: true,
    extra: [PERMISSIONS.ANNOUNCEMENT_CREATE, PERMISSIONS.ANNOUNCEMENT_UPDATE, PERMISSIONS.SETTINGS_READ, PERMISSIONS.ERP_READ],
  },
  {
    name: "teacher",
    displayName: "Teacher",
    description: "Manage classes, exams, results and attendance",
    modules: ["student", "class", "subject", "exam", "result", "attendance", "announcements"],
    extra: [PERMISSIONS.SETTINGS_READ],
  },
  {
    name: "accountant",
    displayName: "Accountant",
    description: "Manage fees, payments and financial reports",
    modules: ["student", "fee", "payment", "basic_reports", "advanced_reports"],
    extra: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.ERP_READ],
  },
  {
    name: "librarian",
    displayName: "Librarian",
    description: "Manage library books and issues",
    modules: ["student", "staff", "library"],
    extra: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.ERP_READ],
  },
  {
    name: "transport_manager",
    displayName: "Transport Manager",
    description: "Manage transport routes and assignments",
    modules: ["student", "transport"],
    extra: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.ERP_READ],
  },
  {
    name: "hr_manager",
    displayName: "HR Manager",
    description: "Manage staff and HR operations",
    modules: ["staff", "attendance", "basic_reports"],
    extra: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.ERP_READ],
  },
  {
    name: "student",
    displayName: "Student",
    description: "View own academic records",
    modules: ["student", "class", "subject", "exam", "result", "attendance", "fee", "payment", "library", "announcements"],
    readOnly: true,
    extra: [],
  },
  {
    name: "parent",
    displayName: "Parent",
    description: "View child's academic and fee records",
    modules: ["student", "exam", "result", "attendance", "fee", "payment", "announcements"],
    readOnly: true,
    extra: [],
  },
]

function buildRolePermissions(
  roleDef: typeof SCHOOL_ROLES[number],
  planModules: string[]
): Permission[] {
  const perms = new Set<Permission>()

  // Add extra always-on permissions
  if (roleDef.extra) roleDef.extra.forEach(p => perms.add(p))

  if ((roleDef as any).allModules) {
    // school_admin gets everything the plan allows
    planModules.forEach(mod => {
      MODULE_PERMISSIONS[mod]?.forEach(p => perms.add(p))
    })
    return Array.from(perms)
  }

  const allowedModules = (roleDef as any).modules as string[] | undefined
  const readOnly = (roleDef as any).readOnly as boolean | undefined

  const targetModules = allowedModules
    ? allowedModules.filter(m => planModules.includes(m))
    : planModules

  targetModules.forEach(mod => {
    const modPerms = MODULE_PERMISSIONS[mod] || []
    modPerms.forEach(p => {
      if (readOnly) {
        // Only include READ permissions
        if (p.endsWith(":read")) perms.add(p)
      } else {
        perms.add(p)
      }
    })
  })

  return Array.from(perms)
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const body = await request.json()
    const validation = subscribeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { planSlug, billingPeriod, amount, paymentMethod, transactionId, schoolName } = validation.data

    // Fetch plan
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { slug: planSlug, isActive: true, deletedAt: null },
    })
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

    // Parse plan modules
    let planModules: string[] = []
    try {
      planModules = Array.isArray(plan.modules)
        ? (plan.modules as string[])
        : JSON.parse(plan.modules as string)
    } catch { planModules = [] }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // If user already has a school, just update subscription
    if (user.schoolId) {
      const subscriptionEnds = billingPeriod === "year"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await prisma.school.update({
        where: { id: user.schoolId },
        data: { subscriptionPlan: planSlug, subscriptionEnds },
      })
      return NextResponse.json({ success: true, redirectTo: "/dashboard" })
    }

    // Generate unique school slug
    const baseSlug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    let slug = baseSlug
    let counter = 1
    while (await prisma.school.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const subscriptionEnds = billingPeriod === "year"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create school
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug,
          email: user.email,
          subscriptionPlan: planSlug,
          subscriptionEnds,
          maxStudents: (plan.maxStudents as number) ?? 500,
          maxUsers: (plan.maxStaff as number) ?? 50,
          status: "active",
        },
      })

      // 2. Create all school-specific roles with plan-filtered permissions
      const createdRoles: Record<string, { id: string }> = {}
      for (const roleDef of SCHOOL_ROLES) {
        const permissions = buildRolePermissions(roleDef, planModules)
        const roleName = roleDef.name
        // Upsert: find existing global role and update its permissions, or create new
        let role = await tx.role.findFirst({ where: { name: roleName, deletedAt: null } })
        if (!role) {
          role = await tx.role.create({
            data: {
              name: roleName,
              displayName: roleDef.displayName,
              description: roleDef.description,
              permissions: JSON.stringify(permissions),
              isSystem: false,
            },
          })
        } else {
          // Update permissions so plan modules are reflected
          role = await tx.role.update({
            where: { id: role.id },
            data: { permissions: JSON.stringify(permissions) },
          })
        }
        createdRoles[roleName] = { id: role.id }
      }

      // 3. Assign user to school as school_admin
      const adminRoleId = createdRoles["school_admin"]?.id
        ?? (await tx.role.findFirst({ where: { name: "school_admin" } }))?.id
        ?? user.roleId

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { schoolId: school.id, roleId: adminRoleId },
        include: { role: true, school: true },
      })

      return { school, updatedUser, adminRoleId }
    })

    // Issue fresh JWT
    const newToken = generateToken({
      userId: result.updatedUser.id,
      email: result.updatedUser.email,
      roleId: result.adminRoleId,
      schoolId: result.school.id,
      role: result.updatedUser.role.name,
    })

    // Send welcome email (non-blocking)
    const base = appBaseUrl()
    sendSubscriptionWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
      schoolName,
      planName: plan.name,
      loginUrl: `${base}/login`,
      dashboardUrl: `${base}/dashboard`,
      billingPeriod: billingPeriod === "year" ? "Yearly" : "Monthly",
      amount,
      transactionId,
    }).catch(e => console.error("[subscribe] email error:", e))

    const response = NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
      school: { id: result.school.id, name: result.school.name, slug: result.school.slug },
      rolesCreated: SCHOOL_ROLES.map(r => r.name),
    })

    response.cookies.set("token", newToken, authCookieOptions(60 * 60 * 24 * 7))
    return response
  } catch (error) {
    console.error("[subscribe] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
