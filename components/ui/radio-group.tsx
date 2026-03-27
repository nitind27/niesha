"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value"> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext)
    const inputId = id || `radio-${value}`
    const checked = selectedValue === value
    
    return (
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          value={value}
          checked={checked}
          onChange={() => {
            if (onValueChange) {
              onValueChange(value)
            }
          }}
          className="sr-only"
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors",
            checked
              ? "border-primary bg-primary"
              : "border-muted-foreground hover:border-primary",
            className
          )}
        >
          {checked && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </label>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }

