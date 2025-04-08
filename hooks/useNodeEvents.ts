"use client"

import { useCallback, useEffect } from "react"
import { useReactFlow } from "reactflow"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Create stable selectors for the store
const handleInputInteractionSelector = (state: any) => state.handleInputInteraction
const duplicateNodeSelector = (state: any) => state.duplicateNode
const setSelectedNodeIdSelector = (state: any) => state.setSelectedNodeId
const deleteNodeSelector = (state: any) => state.deleteNode

/**
 * Hook for standardized node event handling
 * Now mostly a thin wrapper around the central store
 */
export function useNodeEvents(id: string) {
  const { setNodes, getNode } = useReactFlow()
  
  // Use store functions
  const handleInputInteraction = useFlowchartStore(handleInputInteractionSelector)
  const duplicateNode = useFlowchartStore(duplicateNodeSelector)
  const setSelectedNodeId = useFlowchartStore(setSelectedNodeIdSelector)
  const deleteNode = useFlowchartStore(deleteNodeSelector)

  // Handle node selection - update both ReactFlow and our store
  const handleNodeSelect = useCallback(() => {
    // Set selected node ID in our store
    setSelectedNodeId(id)
    
    // Also update ReactFlow's internal selection state for visual feedback
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
  }, [id, setNodes, setSelectedNodeId])

  // Handle node deletion - now using the centralized store function
  const handleNodeDelete = useCallback(() => {
    deleteNode(id)
  }, [id, deleteNode])

  // Handle node duplication - using the centralized store function
  const handleNodeDuplicate = useCallback(() => {
    duplicateNode(id)
  }, [id, duplicateNode])

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

