"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Users, Layers } from "lucide-react"

interface ClassStatsCardsProps {
  stats: {
    total: number
    active: number
    inactive: number
    totalStudents: number
    totalSections: number
  }
  isLoading?: boolean
}

export function ClassStatsCards({ stats, isLoading }: ClassStatsCardsProps) {
  const cards = [
    {
      title: "Total Classes",
      value: stats.total,
      icon: GraduationCap,
      description: "All registered classes",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Classes",
      value: stats.active,
      icon: BookOpen,
      description: "Currently active",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      description: "Students in classes",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Total Sections",
      value: stats.totalSections,
      icon: Layers,
      description: "All sections",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`rounded-full p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-muted-foreground">...</span>
                ) : (
                  card.value
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

