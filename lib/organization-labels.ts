export const ORGANIZATION_TYPES = [
  { value: "school", label: "School / Institute" },
  { value: "company", label: "Company / Business" },
  { value: "trust", label: "Trust / Foundation" },
  { value: "ngo", label: "NGO / Non-profit" },
  { value: "other", label: "Other organization" },
] as const

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]["value"]

export function getOrganizationLabels(organizationType: string | undefined) {
  const t = organizationType || "school"
  switch (t) {
    case "company":
      return {
        memberSingular: "Member",
        memberPlural: "Members",
        cohortSingular: "Team / Unit",
        cohortPlural: "Teams",
        feeSingular: "Billing",
        feePlural: "Billing",
        tagline: "Run people, billing, and operations in one place.",
      }
    case "trust":
    case "ngo":
      return {
        memberSingular: "Beneficiary",
        memberPlural: "Beneficiaries",
        cohortSingular: "Program batch",
        cohortPlural: "Program batches",
        feeSingular: "Contribution",
        feePlural: "Contributions",
        tagline: "Programs, donors, and compliance-ready records.",
      }
    default:
      return {
        memberSingular: "Student",
        memberPlural: "Students",
        cohortSingular: "Class",
        cohortPlural: "Classes",
        feeSingular: "Fee",
        feePlural: "Fees",
        tagline: "Academics, finance, and communication in one ERP.",
      }
  }
}

export function organizationTypeLabel(organizationType: string | undefined) {
  const found = ORGANIZATION_TYPES.find((o) => o.value === (organizationType || "school"))
  return found?.label ?? "Organization"
}
