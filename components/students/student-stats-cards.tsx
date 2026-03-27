"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react"

interface StudentStatsCardsProps {
  stats: {
    total: number
    active: number
    inactive: number
    graduated: number
  }
  isLoading?: boolean
}

export function StudentStatsCards({ stats, isLoading }: StudentStatsCardsProps) {
  const cards = [
    {
      title: "Total Students",
      value: stats.total,
      icon: Users,
      description: "All registered students",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Students",
      value: stats.active,
      icon: UserCheck,
      description: "Currently enrolled",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Inactive Students",
      value: stats.inactive,
      icon: UserX,
      description: "Not currently active",
      color: "text-gray-600",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
    },
    {
      title: "Graduated",
      value: stats.graduated,
      icon: GraduationCap,
      description: "Completed studies",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
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

