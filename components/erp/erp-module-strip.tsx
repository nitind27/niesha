"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, LayoutGrid } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getOrganizationLabels } from "@/lib/organization-labels"
import { canAccessRoute } from "@/lib/route-permissions"

const copy: Record<
  string,
  { title: string; hint: string; links: { href: string; label: string }[] }
> = {
  students: {
    title: "People & CRM",
    hint: "Link records to stakeholders, guardians, or corporate clients from CRM.",
    links: [
      { href: "/dashboard/crm", label: "CRM & contacts" },
      { href: "/dashboard/documents", label: "Documents" },
    ],
  },
  staff: {
    title: "Workforce & projects",
    hint: "Align roles with projects and asset assignments.",
    links: [
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/inventory", label: "Inventory" },
    ],
  },
  classes: {
    title: "Structure",
    hint: "Use batches or teams across school, trust, or company setups.",
    links: [
      { href: "/dashboard/erp", label: "ERP overview" },
      { href: "/dashboard/projects", label: "Programs / projects" },
    ],
  },
  subjects: {
    title: "Curriculum & skills",
    hint: "Map offerings to programs or service lines.",
    links: [
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/reports", label: "Reports" },
    ],
  },
  exams: {
    title: "Assessments",
    hint: "Export outcomes and share with stakeholders.",
    links: [
      { href: "/dashboard/reports", label: "Analytics" },
      { href: "/dashboard/documents", label: "Document vault" },
    ],
  },
  results: {
    title: "Outcomes",
    hint: "Combine academic or KPI data in reports.",
    links: [
      { href: "/dashboard/reports", label: "Reports" },
      { href: "/dashboard/crm", label: "CRM" },
    ],
  },
  attendance: {
    title: "Presence & compliance",
    hint: "Pair with HR workflows and audit trails.",
    links: [
      { href: "/dashboard/staff", label: "Staff" },
      { href: "/dashboard/documents", label: "Policies" },
    ],
  },
  fees: {
    title: "Revenue & billing",
    hint: "Fees, donations, or invoices — same ledger mindset.",
    links: [
      { href: "/dashboard/payments", label: "Payments" },
      { href: "/dashboard/crm", label: "Bill-to contacts" },
    ],
  },
  payments: {
    title: "Cash & treasury",
    hint: "Reconcile with CRM accounts and reporting.",
    links: [
      { href: "/dashboard/reports", label: "Financial reports" },
      { href: "/dashboard/crm", label: "CRM" },
    ],
  },
  library: {
    title: "Knowledge assets",
    hint: "Physical or digital catalog — extend to full inventory.",
    links: [
      { href: "/dashboard/inventory", label: "Inventory" },
      { href: "/dashboard/documents", label: "Documents" },
    ],
  },
  transport: {
    title: "Fleet & logistics",
    hint: "Track routes and link to assets.",
    links: [
      { href: "/dashboard/inventory", label: "Vehicles & assets" },
      { href: "/dashboard/projects", label: "Logistics projects" },
    ],
  },
  announcements: {
    title: "Broadcasts",
    hint: "Company-wide or trust-wide comms from one hub.",
    links: [
      { href: "/dashboard/crm", label: "Audience lists" },
      { href: "/dashboard/erp", label: "ERP hub" },
    ],
  },
  reports: {
    title: "Deeper analytics",
    hint: "Cross-module KPIs — export and schedule next.",
    links: [
      { href: "/dashboard/erp", label: "All modules" },
      { href: "/dashboard/projects", label: "Project status" },
    ],
  },
  settings: {
    title: "Organization profile",
    hint: "Set whether you operate as school, company, trust, or NGO.",
    links: [
      { href: "/dashboard/settings", label: "Settings" },
      { href: "/dashboard/erp", label: "ERP hub" },
    ],
  },
}

export function ErpModuleStrip({ module }: { module: keyof typeof copy }) {
  const { user } = useAuth()
  const orgType = user?.school?.organizationType
  const labels = getOrganizationLabels(orgType)
  const block = copy[module] ?? copy.settings

  if (!user?.permissions || !canAccessRoute(user.permissions, "/dashboard/erp")) {
    return null
  }

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          {block.title}
        </CardTitle>
        <CardDescription>
          {labels.tagline} {block.hint}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {block.links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            {l.label}
            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
