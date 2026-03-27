"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation, useAutoDetectLanguage } from "@/hooks/useLanguage"
import { useLocation } from "@/hooks/useLocation"
import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { Search, Moon, Sun, User, LogOut, Settings } from "lucide-react"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { ServicesDropdown } from "@/components/services/services-dropdown"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TopNav() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const { autoDetect } = useAutoDetectLanguage()

  // Auto-detect language based on location when component mounts
  useEffect(() => {
    if (!location.isLoading && location.state && location.country) {
      autoDetect(location.state, location.country)
    }
  }, [location.isLoading, location.state, location.country, autoDetect])

  return (
    <div className="flex h-16 items-center justify-between border-b border-border/50 bg-gradient-to-r from-background via-background to-muted/30 backdrop-blur-sm shadow-sm px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={t("common.search")}
            className="h-10 w-64 rounded-lg border border-input/50 bg-background/50 backdrop-blur-sm pl-10 pr-4 text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Services Dropdown */}
        <ServicesDropdown />

        {/* Language Selector */}
        <div className="hidden sm:block">
          <LanguageSelector variant="dropdown" />
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg hover:bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-3 rounded-lg hover:bg-accent transition-colors px-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                {user?.firstName?.[0] || "U"}
              </div>
              <div className="hidden text-left md:block">
                <div className="text-sm font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role === "super_admin" 
                    ? "Super Administrator" 
                    : user?.role === "school_admin"
                    ? "School Administrator"
                    : user?.role?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border-border/50">
            <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

