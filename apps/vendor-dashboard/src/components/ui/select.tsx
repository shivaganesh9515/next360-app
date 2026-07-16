"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
  placeholder?: string
  disabled?: boolean
}

function Select({ value, onValueChange, children, className, placeholder, disabled }: SelectProps) {
  return (
    <div data-slot="select" className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className="flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>
}

export { Select, SelectItem }
