"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, X, AlertCircle, Info, DollarSign, BookOpen, Activity, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: string
  category: string
  createdAt: string
  read: boolean
  icon: string
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  alert: AlertCircle,
  info: Info,
  dollar: DollarSign,
  book: BookOpen,
  activity: Activity,
}

const priorityColors: { [key: string]: string } = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/notifications?limit=10")
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
      setLastFetchTime(new Date())
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll for new notifications only when dropdown is open or when window gains focus
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      // Only fetch if it's been at least 30 seconds since last fetch
      if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > 30000) {
        fetchNotifications()
      }
    }, 30000) // Check every 30 seconds when open

    return () => clearInterval(interval)
  }, [isOpen, lastFetchTime, fetchNotifications])

  // Fetch when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
    }
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.read).map((n) => api.patch(`/notifications/${n.id}/read`))
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Info
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg hover:bg-accent transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-background"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background/95 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">No notifications</p>
            </div>
          ) : (
            <div className="py-2">
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                          priorityColors[notification.priority] || priorityColors.normal
                        }`}
                      >
                        {getIcon(notification.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  priorityColors[notification.priority] || priorityColors.normal
                                }`}
                              >
                                {notification.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button variant="ghost" className="w-full text-xs" onClick={fetchNotifications}>
              Refresh
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

