"use client"

import { memo, type ReactNode } from "react"

interface InputSectionProps {
  children: ReactNode
  className?: string
  title?: string
}

function InputSectionComponent({ children, className = "", title }: InputSectionProps) {
  return (
    <div className={`border-t border-gray-800/50 pt-2 pb-1 ${className}`}>
      {title && <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>}
      {children}
    </div>
  )
}

export const InputSection = memo(InputSectionComponent)

