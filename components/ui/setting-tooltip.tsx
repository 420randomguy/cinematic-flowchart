"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface SettingTooltipProps {
  description: string
  className?: string
}

export function SettingTooltip({ description, className = "" }: SettingTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Info className={`h-3 w-3 ml-1 text-gray-500 cursor-help inline-block ${className}`} />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-[9px] p-2 bg-gray-900 border-gray-800">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 