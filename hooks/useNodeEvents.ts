"use client"

import { useCallback, useEffect } from "react"
import { useReactFlow } from "reactflow"
import { useFlowchartStore } from "@/store/useFlowchartStore"

/**
 * Hook for standardized node event handling
 * Provides consistent event handlers for node interactions
 */
export function useNodeEvents(id: string) {
  const { setNodes, getNode } = useReactFlow()
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)

  // Handle node selection
  const handleNodeSelect = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === id,
        style: {
          ...node.style,
          filter: node.id === id ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))" : undefined,
        },
      })),
    )
  }, [id, setNodes])

  // Handle node deletion
  const handleNodeDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }, [id, setNodes])

  // Handle node duplication
  const handleNodeDuplicate = useCallback(() => {
    const node = getNode(id)
    if (!node) return

    const newNodeId = `${node.type}_${Date.now()}`
    const newPosition = {
      x: node.position.x + 20,
      y: node.position.y + 20,
    }

    const newNode = {
      ...node,
      id: newNodeId,
      position: newPosition,
      data: {
        ...node.data,
        isNewNode: true,
      },
    }

    setNodes((nodes) => [...nodes, newNode])
  }, [id, getNode, setNodes])

  // Handle keyboard events for the selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events if this node is selected
      const node = getNode(id)
      if (!node?.selected) return

      // Delete key
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        handleNodeDelete()
      }

      // Duplicate with Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        handleNodeDuplicate()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [id, getNode, handleNodeDelete, handleNodeDuplicate])

  return {
    handleNodeSelect,
    handleNodeDelete,
    handleNodeDuplicate,
    handleInputInteraction,
  }
}

