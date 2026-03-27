"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary/20 bg-primary/5",
        success: "border-green-500/20 bg-green-500/5",
        warning: "border-yellow-500/20 bg-yellow-500/5",
        destructive: "border-red-500/20 bg-red-500/5",
        outline: "border-2",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface DataCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string
  description?: string
  icon?: LucideIcon
  iconClassName?: string
  footer?: React.ReactNode
  loading?: boolean
  error?: string
  onClick?: () => void
}

export const DataCard = React.forwardRef<HTMLDivElement, DataCardProps>(
  (
    {
      className,
      variant,
      size,
      title,
      description,
      icon: Icon,
      iconClassName,
      footer,
      loading,
      error,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const isClickable = !!onClick

    return (
      <Card
        ref={ref}
        className={cn(
          cardVariants({ variant, size }),
          isClickable && "cursor-pointer hover:scale-[1.02]",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {(title || description || Icon) && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {Icon && (
                <div className={cn("rounded-full p-2", iconClassName)}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          ) : (
            children
          )}
        </CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    )
  }
)
DataCard.displayName = "DataCard"

// Stat Card Component
export interface StatCardProps extends Omit<DataCardProps, "children"> {
  value: string | number
  label: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: LucideIcon
  iconColor?: string
  iconBgColor?: string
}

export function StatCard({
  value,
  label,
  trend,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/20",
  ...props
}: StatCardProps) {
  return (
    <DataCard {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-full p-3", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        )}
      </div>
    </DataCard>
  )
}

