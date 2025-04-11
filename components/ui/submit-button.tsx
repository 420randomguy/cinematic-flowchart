"use client"

import type React from "react"

import type { SubmitButtonProps } from "@/types"
import { Button } from "@/components/ui/button"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

export function SubmitButton({
  disabled = false,
  handleInputInteraction,
  nodeId,
}: Omit<SubmitButtonProps, 'isSubmitting' | 'isGenerated' | 'onClick' | 'timeRemaining'>) {
  // Get the store function if handleInputInteraction isn't provided
  const storeHandleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const createRenderNode = useFlowchartStore((state) => state.createRenderNode)
  const nodes = useFlowchartStore((state) => state.nodes)
  const edges = useFlowchartStore((state) => state.edges)
  const setNodes = useFlowchartStore((state) => state.setNodes)
  const inputHandler = handleInputInteraction || storeHandleInputInteraction
  
  // Create interactive props but remove onClick to avoid collision
  const { onClick: _ignoredOnClick, ...safeInteractiveProps } = createInteractiveProps(inputHandler)

  // Generate random request ID
  const generateRequestId = () => {
    return Date.now().toString();
  }

  // Handle button click with proper event propagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Generate random request ID for this submission
    const requestId = generateRequestId();
    
    // Find the source node and check if there are connected render nodes
    if (nodeId) {
      // Get all edges from this node
      const connectedEdges = edges.filter(edge => edge.source === nodeId)
      
      // Get all connected render nodes
      const connectedRenderNodes = connectedEdges
        .map(edge => {
          const targetNode = nodes.find(node => node.id === edge.target)
          return targetNode?.type === "render" ? targetNode : null
        })
        .filter(Boolean)
      
      // Find an existing render node that hasn't generated content yet
      const unusedRenderNode = connectedRenderNodes.find(node => !node?.data?.hasGenerated)
      
      if (unusedRenderNode) {
        // Reuse existing render node that hasn't generated content yet
        setNodes(currentNodes => {
          const updatedNodes = currentNodes.map(node => 
            node.id === unusedRenderNode.id ? {
              ...node,
              data: {
                ...node.data,
                isSubmitted: true,
                requestId: requestId
              }
            } : node
          )
          return updatedNodes
        })
      } else if (connectedRenderNodes.length > 0) {
        // All connected render nodes already have content, create a new one
        createRenderNode(nodeId, requestId)
      } else {
        // No render nodes connected, create one
        createRenderNode(nodeId, requestId)
      }
    }
  }

  return (
    <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
      <Button
        onClick={handleClick}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          disabled
            ? "bg-gray-800/30 border-gray-700/50 text-gray-500"
            : "bg-gray-800/80 border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70"
        }`}
        {...safeInteractiveProps}
      >
        Submit
      </Button>
    </div>
  )
}

