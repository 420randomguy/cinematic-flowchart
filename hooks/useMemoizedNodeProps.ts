"use client"

import { useMemo, useCallback } from "react"
import { useReactFlow } from "reactflow"
import { useConnectionStore } from "@/store/useConnectionStore"

/**
 * Hook to provide memoized props and callbacks for node components
 * This reduces unnecessary re-renders by ensuring stable references
 */
export function useMemoizedNodeProps(id: string, data: any) {
  const { setNodes } = useReactFlow()
  const { updateNodeContent, updateNodeImageUrl } = useConnectionStore()

  // Memoize the update content function
  const updateContent = useCallback(
    (content: string) => {
      // Update this node's content
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, content } } : node)))

      // Sync content to connected nodes
      updateNodeContent(id, content)
    },
    [id, setNodes, updateNodeContent],
  )

  // Memoize the update image function
  const updateImage = useCallback(
    (imageUrl: string) => {
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, imageUrl } } : node)))

      // Update connected nodes that might use this image
      updateNodeImageUrl(id, imageUrl)
    },
    [id, setNodes, updateNodeImageUrl],
  )

  // Memoize the update settings function
  const updateSettings = useCallback(
    (settings: Record<string, any>) => {
      setNodes((nodes) =>
        nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...settings } } : node)),
      )
    },
    [id, setNodes],
  )

  // Memoize common node props to prevent unnecessary re-renders
  const nodeProps = useMemo(
    () => ({
      title: data.title || "",
      content: data.content || "",
      imageUrl: data.imageUrl || null,
      seed: data.seed || Math.floor(Math.random() * 1000000000).toString(),
      quality: data.quality || 80,
      modelId: data.modelId || "default",
      modelSettings: data.modelSettings || {},
      sourceNodeContent: data.sourceNodeContent || "",
    }),
    [data],
  )

  return {
    nodeProps,
    updateContent,
    updateImage,
    updateSettings,
  }
}

