"use client"

import { memo } from "react"

interface TextPreviewProps {
  text?: string | null
  nodeId?: string
  maxLength?: number
  className?: string
  showIfEmpty?: boolean
  emptyText?: string
  isConnected?: boolean
}

function TextPreviewComponent({
  text,
  nodeId,
  maxLength = 25, // Changed from 100 to 25 as requested
  className = "",
  showIfEmpty = false,
  emptyText = "Connect text node",
  isConnected = false,
}: TextPreviewProps) {
  // Determine if there's text content
  const hasText = !!text

  // Always show for output nodes, even if empty
  if (!hasText && !showIfEmpty) return null

  // Truncate text if needed
  const displayText = hasText ? (text!.length > maxLength ? `${text!.substring(0, maxLength)}...` : text) : emptyText

  // Determine styling based on connection status and content
  const bgColor = hasText ? "bg-black/40" : "bg-black/20"
  const textColor = hasText ? "text-yellow-300/90" : "text-gray-500"
  const borderColor = isConnected ? "border-green-900/20" : "border-gray-800/20"

  return (
    <div
      className={`mt-2 p-2 ${bgColor} rounded-sm border ${borderColor} ${className}`}
      data-has-text={hasText.toString()}
      data-node-id={nodeId}
    >
      <p className={`text-[9px] font-mono ${textColor} leading-relaxed`}>{displayText}</p>
    </div>
  )
}

// Add displayName to ensure proper debugging and component identification
TextPreviewComponent.displayName = "TextPreview"

export const TextPreview = memo(TextPreviewComponent)

