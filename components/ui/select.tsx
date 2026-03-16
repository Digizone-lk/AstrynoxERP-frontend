"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

function getTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join("")
  if (React.isValidElement(node))
    return getTextContent((node.props as { children?: React.ReactNode }).children)
  return ""
}

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  popupRef: React.RefObject<HTMLDivElement | null>
  registerLabel: (value: string, label: string) => void
  getLabel: (value: string) => string
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  popupRef: { current: null },
  registerLabel: () => {},
  getLabel: (v) => v,
})

function Select({
  children,
  value,
  onValueChange,
  defaultValue = "",
}: {
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popupRef = React.useRef<HTMLDivElement>(null)
  const labelsRef = React.useRef<Record<string, string>>({})

  const isControlled = value !== undefined
  const currentValue = isControlled ? value! : internalValue

  const registerLabel = React.useCallback((v: string, label: string) => {
    labelsRef.current[v] = label
  }, [])

  const getLabel = React.useCallback((v: string) => {
    return labelsRef.current[v] || v
  }, [])

  function handleValueChange(v: string) {
    if (!isControlled) setInternalValue(v)
    onValueChange?.(v)
    setOpen(false)
  }

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen, triggerRef, popupRef, registerLabel, getLabel }}
    >
      {children}
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = React.useContext(SelectContext)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 opacity-50 shrink-0" />
    </button>
  )
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, getLabel } = React.useContext(SelectContext)
  return (
    <span className={cn("truncate", !value && "text-muted-foreground")}>
      {value ? getLabel(value) : placeholder}
    </span>
  )
}

function SelectContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { open, setOpen, triggerRef, popupRef } = React.useContext(SelectContext)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [open, setOpen, triggerRef, popupRef])

  // Always render children hidden so SelectItems can register their labels
  const hidden = <div style={{ display: "none" }} aria-hidden>{children}</div>

  if (!mounted) return hidden

  const rect = triggerRef.current?.getBoundingClientRect()

  return (
    <>
      {hidden}
      {open && createPortal(
        <div
          ref={popupRef}
          className={cn(
            "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-zinc-900 shadow-md py-1",
            className
          )}
          style={rect ? { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width } : {}}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  )
}

function SelectItem({
  value,
  children,
  className,
}: {
  value: string
  children?: React.ReactNode
  className?: string
}) {
  const { value: selectedValue, onValueChange, registerLabel } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  React.useEffect(() => {
    registerLabel(value, getTextContent(children))
  }, [value, children, registerLabel])

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onMouseDown={(e) => {
        e.preventDefault()
        onValueChange(value)
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {isSelected && (
        <span className="absolute left-2 flex size-3.5 items-center justify-center">
          <Check className="size-4" />
        </span>
      )}
      {children}
    </div>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
