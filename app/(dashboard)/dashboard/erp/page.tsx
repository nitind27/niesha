"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutGrid,
  Contact2,
  Package,
  FolderKanban,
  FileStack,
  GraduationCap,
  Users,
  DollarSign,
  BarChart3,
  ArrowRight,
  Building2,
} from "lucide-react"
import { getOrganizationLabels, organizationTypeLabel } from "@/lib/organization-labels"

const modules = [
  {
    href: "/dashboard/students",
    title: "People / members",
    desc: "Students, beneficiaries, or program participants",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/staff",
    title: "Workforce",
    desc: "Employees, volunteers, teachers",
    icon: Users,
  },
  {
    href: "/dashboard/fees",
    title: "Billing & fees",
    desc: "Tuition, invoices, or contributions",
    icon: DollarSign,
  },
  {
    href: "/dashboard/crm",
    title: "CRM & contacts",
    desc: "Clients, donors, guardians, vendors",
    icon: Contact2,
  },
  {
    href: "/dashboard/inventory",
    title: "Inventory & assets",
    desc: "Stock, equipment, fleet spares",
    icon: Package,
  },
  {
    href: "/dashboard/projects",
    title: "Projects & programs",
    desc: "CSR, trust programs, delivery workstreams",
    icon: FolderKanban,
  },
  {
    href: "/dashboard/documents",
    title: "Document center",
    desc: "Policies, contracts, compliance",
    icon: FileStack,
  },
  {
    href: "/dashboard/reports",
    title: "Reports & analytics",
    desc: "Cross-module KPIs and exports",
    icon: BarChart3,
  },
]

export default function ErpHubPage() {
  const { user } = useAuth()
  const orgType = user?.school?.organizationType
  const industry = user?.school?.industry
  const labels = getOrganizationLabels(orgType)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-primary" />
            ERP Hub
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            One workspace for schools, companies, trusts, and NGOs. Labels adapt to your organization type in
            Settings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Building2 className="h-3 w-3" />
            {organizationTypeLabel(orgType)}
          </Badge>
          {industry ? (
            <Badge variant="outline">{industry}</Badge>
          ) : null}
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">How your tenant is configured</CardTitle>
          <CardDescription>{labels.tagline}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <span className="text-muted-foreground">Primary roll-up</span>
            <p className="font-medium">{labels.memberPlural}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Structure</span>
            <p className="font-medium">{labels.cohortPlural}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Money module framing</span>
            <p className="font-medium">{labels.feePlural}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Organization</span>
            <p className="font-medium">{user?.school?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Modules & shortcuts</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href}>
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        {m.title}
                        <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
                      </CardTitle>
                      <CardDescription className="mt-1">{m.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations checklist</CardTitle>
          <CardDescription>Advance your rollout across any sector</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
          <p>• Define organization type and industry in Settings → Organization.</p>
          <p>• Sync people in {labels.memberPlural} + Staff, then link CRM contacts.</p>
          <p>• Register assets in Inventory; track initiatives on Projects.</p>
          <p>• Store policies in Document center; review Reports weekly.</p>
        </CardContent>
      </Card>
    </div>
  )
}
