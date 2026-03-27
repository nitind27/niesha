"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Briefcase } from "lucide-react"

interface StaffStatsCardsProps {
  stats: {
    total: number
    active: number
    onLeave: number
    terminated: number
    inactive: number
  }
  isLoading?: boolean
}

export function StaffStatsCards({ stats, isLoading }: StaffStatsCardsProps) {
  const cards = [
    {
      title: "Total Staff",
      value: stats.total,
      icon: Users,
      description: "All registered staff",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Staff",
      value: stats.active,
      icon: UserCheck,
      description: "Currently working",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "On Leave",
      value: stats.onLeave,
      icon: Briefcase,
      description: "Currently on leave",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    {
      title: "Terminated",
      value: stats.terminated,
      icon: UserX,
      description: "Terminated staff",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
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

