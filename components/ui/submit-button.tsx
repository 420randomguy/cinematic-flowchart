"use client"

import type React from "react"

import type { SubmitButtonProps } from "@/types"
import { Button } from "@/components/ui/button"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { useCallback, useMemo } from "react"

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
  // Get visual mirror content to check for image content
  const visibleContent = useVisualMirrorStore((state) => state.visibleContent)
  
  // Create interactive props but remove onClick to avoid collision
  const { onClick: _ignoredOnClick, ...safeInteractiveProps } = createInteractiveProps(inputHandler)

  // Get the current node from the flowchart store
  const currentNode = useMemo(() => {
    return nodes.find(node => node.id === nodeId)
  }, [nodes, nodeId])

  // Generate random request ID
  const generateRequestId = () => {
    return Date.now().toString();
  }

  // Check for required connections based on node type
  const isButtonDisabled = useMemo(() => {
    if (!nodeId || !currentNode) return true

    const nodeType = currentNode.type

    // Get all incoming edges to this node
    const incomingEdges = edges.filter(edge => edge.target === nodeId)
    
    // Check if a text node is connected
    const hasTextNodeConnected = incomingEdges.some(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source)
      return sourceNode && (sourceNode.type === "text" || sourceNode.type === "url") && edge.targetHandle === "text"
    })

    // Check if an image node is connected
    const hasImageNodeConnected = incomingEdges.some(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source)
      return sourceNode && (sourceNode.type === "image" || sourceNode.type === "text-to-image" || sourceNode.type === "image-to-image") && edge.targetHandle === "image"
    })

    // Check if the connected image node has an image
    const hasImageContent = (() => {
      const imageEdge = incomingEdges.find(edge => edge.targetHandle === "image")
      if (!imageEdge) return false
      
      const sourceNodeId = imageEdge.source
      const sourceNode = nodes.find(node => node.id === sourceNodeId)
      
      // Check for image in the source node via visualMirrorStore or node data
      return sourceNode && (
        (visibleContent[sourceNodeId]?.imageUrl) || 
        (sourceNode.data?.imageUrl) ||
        (sourceNode.data?.sourceImageUrl)
      )
    })()

    // Logic for different node types
    if (nodeType?.includes("text-to-")) {
      // For text-to-* nodes, require only text connection
      return !hasTextNodeConnected || disabled
    } else if (nodeType?.includes("image-to-")) {
      // For image-to-* nodes, require both text and image connection, and image must have content
      return !hasTextNodeConnected || !hasImageNodeConnected || !hasImageContent || disabled
    }
    
    // Default to provided disabled state for other node types
    return disabled
  }, [nodeId, currentNode, nodes, edges, visibleContent, disabled])

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
      
      // 1. Find an idle render node created from context menu (not submitted yet and not generating)
      const idleContextMenuRenderNode = connectedRenderNodes.find(node => 
        !node?.data?.isSubmitted && 
        !node?.data?.hasGenerated
      )
      
      // 2. Find an existing render node that hasn't generated content yet but was previously submitted
      const unusedRenderNode = connectedRenderNodes.find(node => 
        node?.data?.isSubmitted && 
        !node?.data?.hasGenerated
      )
      
      console.log("Connected render nodes:", connectedRenderNodes.map(n => ({ 
        id: n?.id, 
        isSubmitted: n?.data?.isSubmitted, 
        hasGenerated: n?.data?.hasGenerated 
      })))
      
      if (idleContextMenuRenderNode) {
        // Reuse an idle render node created from context menu
        console.log(`[SubmitButton] Reusing idle context menu render node: ${idleContextMenuRenderNode.id}`)
        
        // Force trigger generation in VisualMirrorStore for this node
        const { startGeneration } = require('@/store/useVisualMirrorStore').useVisualMirrorStore.getState();
        
        setNodes(currentNodes => {
          const updatedNodes = currentNodes.map(node => 
            node.id === idleContextMenuRenderNode.id ? {
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
        
        // Delay the generation start slightly to ensure state updates are processed
        setTimeout(() => {
          if (!idleContextMenuRenderNode.data.hasGenerated) {
            console.log(`[SubmitButton] Triggering generation for node: ${idleContextMenuRenderNode.id}`)
            startGeneration(idleContextMenuRenderNode.id)
          }
        }, 100)
      } else if (unusedRenderNode) {
        // Reuse existing render node that hasn't generated content yet
        console.log(`[SubmitButton] Reusing existing submitted render node: ${unusedRenderNode.id}`)
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
        console.log(`[SubmitButton] All existing render nodes have content, creating new one`)
        createRenderNode(nodeId, requestId)
      } else {
        // No render nodes connected, create one
        console.log(`[SubmitButton] No render nodes connected, creating new one`)
        createRenderNode(nodeId, requestId)
      }
    }
  }

  return (
    <div className="flex items-center justify-between py-1.5 my-0.5">
      <Button
        onClick={handleClick}
        disabled={isButtonDisabled}
        variant="outline"
        size="sm"
        className={`px-2 py-0.5 h-auto text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
          isButtonDisabled
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

