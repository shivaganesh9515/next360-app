"use client"

import { cn } from "@/lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div data-slot="tabs" className={className}>
      {children}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  activeTab?: string
  onValueChange?: (value: string) => void
}

function TabsTrigger({ value, children, className, activeTab, onValueChange }: TabsTriggerProps & { activeTab?: string; onValueChange?: (value: string) => void }) {
  const isActive = activeTab === value
  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        !isActive && "hover:bg-background/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  activeTab?: string
}

function TabsContent({ value, children, className, activeTab }: TabsContentProps & { activeTab?: string }) {
  if (activeTab !== value) return null
  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
