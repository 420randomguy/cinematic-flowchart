"use client"

import { memo, useEffect, useState, useRef } from "react"

interface TextPreviewProps {
  text?: string | null
  nodeId?: string
  maxLength?: number
  className?: string
  showIfEmpty?: boolean
  emptyText?: string
  isConnected?: boolean
  showFullText?: boolean
}

function TextPreviewComponent({
  text,
  nodeId,
  maxLength = 25,
  className = "",
  showIfEmpty = false,
  emptyText = "Connect text node",
  isConnected = false,
  showFullText = false,
}: TextPreviewProps) {
  // State to track previous text for change detection
  const [prevText, setPrevText] = useState(text)
  // State to track animation
  const [isUpdated, setIsUpdated] = useState(false)
  // Ref to store timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Detect text changes and trigger animation
  useEffect(() => {
    // Only trigger if there was a previous text and it's different
    if (prevText !== undefined && prevText !== text) {
      // Set updated flag to trigger animation
      setIsUpdated(true)
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Remove the animation class after a delay
      timeoutRef.current = setTimeout(() => {
        setIsUpdated(false)
      }, 1000)
    }
    
    // Update previous text for next comparison
    setPrevText(text)
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, prevText])

  // Determine if there's text content
  const hasText = !!text && text.trim().length > 0

  // Always show for output nodes, even if empty
  if (!hasText && !showIfEmpty) return null

  // Log for debugging
  console.log(`[TextPreview] text:"${text}", hasText:${hasText}, showIfEmpty:${showIfEmpty}, emptyText:"${emptyText}"`)

  // Truncate text if needed, unless showFullText is true
  const displayText = hasText 
    ? (showFullText ? text : (text!.length > maxLength ? `${text!.substring(0, maxLength)}...` : text))
    : emptyText

  // Determine styling based on connection status and content
  const bgColor = hasText ? "bg-black/40" : "bg-black/20"
  const textColor = hasText ? "text-yellow-300/90" : "text-gray-500"
  const borderColor = isConnected ? "border-green-900/20" : "border-gray-800/20"
  
  // Add animation class when content updates
  const animationClass = isUpdated ? "border-yellow-500 transition-colors duration-300" : ""

  return (
    <div
      className={`mt-2 p-2 ${bgColor} rounded-sm border ${borderColor} ${animationClass} ${className}`}
      data-has-text={hasText.toString()}
      data-node-id={nodeId}
    >
      <p className={`text-[9px] font-mono ${textColor} leading-relaxed ${hasText ? "font-semibold" : ""} break-words`}>
        {hasText && <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5 align-middle"></span>}
        {displayText}
      </p>
    </div>
  )
}

// Add displayName to ensure proper debugging and component identification
TextPreviewComponent.displayName = "TextPreview"

export const TextPreview = memo(TextPreviewComponent)

