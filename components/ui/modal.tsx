"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  contentClassName?: string
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
  full: "max-w-[95vw]",
}

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  contentClassName,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
  }

  const dialogContent = (
    <DialogContent
      className={cn(sizeClasses[size], contentClassName)}
      onInteractOutside={(e) => {
        if (!closeOnOverlayClick) {
          e.preventDefault()
        }
      }}
      onEscapeKeyDown={(e) => {
        if (!closeOnOverlayClick) {
          e.preventDefault()
        }
      }}
    >
      {(title || description) && (
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
      )}
      <div className={cn("overflow-y-auto max-h-[calc(90vh-8rem)]", className)}>{children}</div>
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {dialogContent}
    </Dialog>
  )
}

// Confirmation Modal Component
export interface ConfirmModalProps extends Omit<ModalProps, "children" | "footer"> {
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function ConfirmModal({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
  ...modalProps
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (modalProps.onOpenChange) {
      modalProps.onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    if (modalProps.onOpenChange) {
      modalProps.onOpenChange(false)
    }
  }

  return (
    <Modal
      {...modalProps}
      footer={
        <>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  )
}

