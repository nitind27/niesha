import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const ALLOWED_KEYS = [
  "site_name",
  "site_tagline",
  "site_logo_url",
  "site_favicon_url",
  "site_primary_color",
  "site_footer_text",
  "support_email",
  "support_phone",
  "maintenance_mode",
  "allow_registration",
] as const

type SettingKey = (typeof ALLOWED_KEYS)[number]

const updateSchema = z.record(z.string())

// Helper: upsert a single key
async function upsertSetting(key: string, value: string) {
  return prisma.globalSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

// GET /api/admin/global-settings — public read (used by layout)
export async function GET() {
  const rows = await prisma.globalSetting.findMany()
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  // Fill defaults for any missing keys
  const defaults: Record<SettingKey, string> = {
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
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in settings)) settings[k] = v
  }
  return NextResponse.json({ settings })
}

// PATCH /api/admin/global-settings — super_admin only
export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const updates: Promise<any>[] = []
  for (const [key, value] of Object.entries(parsed.data)) {
    if (ALLOWED_KEYS.includes(key as SettingKey)) {
      updates.push(upsertSetting(key, String(value)))
    }
  }
  await Promise.all(updates)

  // Return updated settings
  const rows = await prisma.globalSetting.findMany()
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  return NextResponse.json({ settings })
}
