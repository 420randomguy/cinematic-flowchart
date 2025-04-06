"use client"

import { useState, useEffect, useCallback } from "react"
import { useConnections } from "@/contexts/ConnectionContext"

interface UseContentMonitorProps {
  nodeId: string
  sourceNodeIds?: string[]
  refreshInterval?: number
  onContentChange?: (content: string) => void
}

/**
 * Hook for monitoring content changes from source nodes
 * This hook automatically refreshes content when source nodes change
 */
export function useContentMonitor({
  nodeId,
  sourceNodeIds = [],
  refreshInterval = 500,
  onContentChange,
}: UseContentMonitorProps) {
  const { monitorNodeContent, connectionLookup } = useConnections()
  const [content, setContent] = useState("")

  // Get initial content and refresh function
  const { content: initialContent, refresh } = monitorNodeContent(nodeId, sourceNodeIds)

  // Set initial content
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
      onContentChange?.(initialContent)
    }
  }, [initialContent, onContentChange])

  // Set up interval to check for content changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newContent = refresh()
      if (newContent && newContent !== content) {
        setContent(newContent)
        onContentChange?.(newContent)
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refresh, content, refreshInterval, onContentChange])

  // Get connected source nodes
  const connectedSourceNodes = connectionLookup.getSourceNodes(nodeId)

  // Manually refresh content
  const refreshContent = useCallback(() => {
    const newContent = refresh()
    if (newContent) {
      setContent(newContent)
      onContentChange?.(newContent)
    }
    return newContent
  }, [refresh, onContentChange])

  return {
    content,
    refreshContent,
    hasConnectedSources: connectedSourceNodes.length > 0,
    connectedSourceNodes,
  }
}

