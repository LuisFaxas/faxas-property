"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ open, onOpenChange, children, title }: BottomSheetProps) {
  const [startY, setStartY] = React.useState(0)
  const [currentY, setCurrentY] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const sheetRef = React.useRef<HTMLDivElement>(null)

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

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "glass border-t border-white/10",
          "rounded-t-2xl",
          "animate-in slide-in-from-bottom-full duration-300",
          "max-h-[85vh] min-h-[200px]",
          "flex flex-col"
        )}
        style={{
          transform: `translateY(${currentY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
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
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}