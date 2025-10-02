"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface AppSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  /**
   * Height mode for the sheet
   * - detail: 85vh (default for detail/view sheets)
   * - form: 90vh (for form dialogs)
   * - fullscreen: calc() with safe area (full-screen sheets)
   */
  mode?: 'detail' | 'form' | 'fullscreen'
  /**
   * Height fitting behavior
   * - max: Fixed height from mode (default, current behavior)
   * - content: Auto-fit to content with max-height from mode
   */
  fit?: 'content' | 'max'
  /** Sticky footer content (buttons, actions, etc.) */
  footer?: React.ReactNode
}

export function AppSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  mode = 'detail',
  fit = 'max',
  footer
}: AppSheetProps) {
  const [startY, setStartY] = React.useState(0)
  const [currentY, setCurrentY] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const sheetRef = React.useRef<HTMLDivElement>(null)

  // Fixed height classes for fit='max'
  const fixedHeightClass = {
    detail: 'h-modal-detail',
    form: 'h-modal-form',
    fullscreen: 'h-modal-fullscreen'
  }[mode]

  // Max height classes for fit='content'
  const maxHeightClass = {
    detail: 'max-h-modal-detail',
    form: 'max-h-modal-form',
    fullscreen: 'max-h-modal-fullscreen'
  }[mode]

  const minHeightClass = 'min-h-modal-min'

  // Compute final height class based on fit mode
  const heightClass = fit === 'content'
    ? `h-auto ${maxHeightClass} ${minHeightClass}`
    : `${fixedHeightClass} ${minHeightClass}`

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startY
    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onOpenChange(false)
    }
    setCurrentY(0)
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartY(e.clientY)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaY = e.clientY - startY
    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }

  const handleMouseUp = () => {
    if (currentY > 100) {
      onOpenChange(false)
    }
    setCurrentY(0)
    setIsDragging(false)
  }

  // Global mouse handlers for drag continuation
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY
        if (deltaY > 0) {
          setCurrentY(deltaY)
        }
      }

      const handleGlobalMouseUp = () => {
        if (currentY > 100) {
          onOpenChange(false)
        }
        setCurrentY(0)
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, startY, currentY, onOpenChange])

  // Escape key handler
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        data-state={open ? 'open' : 'closed'}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-modal",
          "glass border-t border-white/10",
          "rounded-t-2xl",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-500",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-300",
          heightClass,
          "flex flex-col overflow-hidden"
        )}
        data-state={open ? 'open' : 'closed'}
        style={{
          transform: `translateY(${currentY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "app-sheet-title" : undefined}
        aria-describedby={description ? "app-sheet-description" : undefined}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="w-12 h-1 rounded-full bg-white/30" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h3 id="app-sheet-title" className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                )}
                {description && (
                  <p id="app-sheet-description" className="text-sm text-white/60 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white -mt-1"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-graphite-900/95 backdrop-blur-sm border-t border-white/10 p-3 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
