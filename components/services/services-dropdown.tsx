"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Grid3x3, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ServicesModal } from "./services-modal"
import { motion } from "framer-motion"

export function ServicesDropdown() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Grid3x3 className="h-5 w-5" />
            <span className="hidden md:inline">Services</span>
            <ChevronDown className="h-4 w-4 hidden md:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background/95 backdrop-blur-sm border-border/50">
          <DropdownMenuLabel className="font-semibold">Services</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Grid3x3 className="mr-2 h-4 w-4" />
            View All Services
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">
              Quick access to all platform services
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ServicesModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}

