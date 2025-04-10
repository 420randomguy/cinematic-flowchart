"use client"

import { useEffect, useCallback } from "react"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

/**
 * Hook to update VisualMirror store with node data
 */
export function useVisualMirrorUpdate(id: string, data: any, isSubmitting = false) {
  const { showContent, clearContent } = useVisualMirrorStore()

  // Helper function to determine source content type
  const getNodeContent = useCallback(() => {
    const content: Record<string, any> = {}
    
    // Handle text content
    if (data.content) {
      content.text = data.content
    } else if (data.sourceNodeContent) {
      content.text = data.sourceNodeContent
    }
    
    // Handle image content
    if (!isSubmitting) {
      if (data.imageUrl) {
        content.imageUrl = data.imageUrl
      } else if (data.sourceImageUrl) {
        content.imageUrl = data.sourceImageUrl
      } else if (data.videoUrl) {
        // For video nodes
        content.imageUrl = data.videoUrl
      }
    }
    
    return content
  }, [data, isSubmitting])

  // Update VisualMirror store with node content
  useEffect(() => {
    const content = getNodeContent()
    
    // Only update if we have any content
    if (Object.keys(content).length > 0) {
      showContent(id, content)
    } else {
      // Clear visual mirror if no valid data
      clearContent(id)
    }
  }, [
    id, 
    data.content, 
    data.sourceNodeContent, 
    data.imageUrl, 
    data.sourceImageUrl,
    data.videoUrl,
    isSubmitting,
    showContent,
    clearContent,
    getNodeContent
  ])

  // Return functions for manual updates (for special cases)
  return { 
    updateContent: showContent,
    clearContent
  }
} 