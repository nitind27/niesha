import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const defaults = [
  ["site_name", "Codeat ERP"],
  ["site_tagline", "Multi-tenant ERP for schools, companies, trusts, and NGOs"],
  ["site_logo_url", ""],
  ["site_favicon_url", ""],
  ["site_primary_color", "#3b82f6"],
  ["site_footer_text", "© 2025 Codeat ERP. All rights reserved."],
  ["support_email", "support@codeat.in"],
  ["support_phone", ""],
  ["maintenance_mode", "false"],
  ["allow_registration", "true"],
]

for (const [key, value] of defaults) {
  await prisma.globalSetting.upsert({
    where: { key },
    update: {},
    create: { key, value },
  })
  console.log(`✓ ${key}`)
}

console.log("Done.")
await prisma.$disconnect()
