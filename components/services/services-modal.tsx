"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  Library,
  Bus,
  Megaphone,
  BarChart3,
  Settings,
  Search,
  ArrowRight,
  Check,
} from "lucide-react"
import api from "@/lib/api"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  description: string
  icon: string
  category: string
  features: string[]
  route: string
  enabled: boolean
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  GraduationCap,
  Users,
  School,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  Library,
  Bus,
  Megaphone,
  BarChart3,
  Settings,
}

const categoryColors: { [key: string]: string } = {
  Core: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Academic: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Finance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Resources: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Communication: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Analytics: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  System: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

interface ServicesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServicesModal({ open, onOpenChange }: ServicesModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, Service[]>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchServices()
    }
  }, [open])

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/services")
      setServices(response.data.services || [])
      setServicesByCategory(response.data.servicesByCategory || {})
    } catch (error) {
      console.error("Failed to fetch services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...Object.keys(servicesByCategory)]

  const handleServiceClick = (service: Service) => {
    if (service.enabled && service.route) {
      // Check if user is authenticated by trying to access the route
      // If not authenticated, redirect to login
      router.push(service.route)
      onOpenChange(false)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Settings
    return <IconComponent className="h-6 w-6" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Available Services
              </DialogTitle>
              <DialogDescription className="mt-2">
                Explore and access all available services in the platform
              </DialogDescription>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service, index) => {
                const Icon = getIcon(service.icon)
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleServiceClick(service)}
                    className={cn(
                      "group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300",
                      "hover:border-primary hover:shadow-lg hover:shadow-primary/10",
                      "bg-card hover:bg-accent/50",
                      service.enabled ? "opacity-100" : "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10 group-hover:from-primary/20 group-hover:to-purple-600/20 transition-colors">
                        <div className="text-primary">{Icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0",
                              categoryColors[service.category] || categoryColors.System
                            )}
                          >
                            {service.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="space-y-1 mb-3">
                          {service.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="line-clamp-1">{feature}</span>
                            </div>
                          ))}
                          {service.features.length > 3 && (
                            <p className="text-xs text-muted-foreground pl-5">
                              +{service.features.length - 3} more features
                            </p>
                          )}
                        </div>
                        {service.enabled && (
                          <div className="flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                            <span>Access Service</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                    {service.enabled && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/5 group-hover:to-primary/5 transition-all pointer-events-none" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} available
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

