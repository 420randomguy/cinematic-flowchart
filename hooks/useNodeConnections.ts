"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useReactFlow } from "reactflow"
import { useConnectionStore } from "@/store/useConnectionStore"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Create stable selectors for the store
const updateNodeContentSelector = (state: any) => state.updateNodeContent
const updateNodeImageSelector = (state: any) => state.updateNodeImage

/**
 * Unified hook for handling node connections and content monitoring
 * Now a thin wrapper around the central store
 */
export function useNodeConnections({
  id,
  textHandleId = "text",
  imageHandleId = "image",
}: {
  id: string
  textHandleId?: string
  imageHandleId?: string
}) {
  // Use ReactFlow and Store hooks
  const { getNodes, getEdges } = useReactFlow()
  
  // Use the centralized store functions
  const updateNodeContent = useFlowchartStore(updateNodeContentSelector)
  const updateNodeImage = useFlowchartStore(updateNodeImageSelector)

  // Local state for tracking connected content
  const [textContent, setTextContent] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Get connected nodes - keep this logic for analyzing connections
  const connectedNodes = useMemo(() => {
    const edges = getEdges()
    const nodes = getNodes()

    // Find all nodes that are connected to this node
    const sourceNodes = edges
      .filter((edge) => edge.target === id)
      .map((edge) => edge.source)

    const targetNodes = edges
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target)

    // Filter source nodes by type
    const textNodes = sourceNodes.filter((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.type === "text"
    })

    const imageNodes = sourceNodes.filter((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.type === "image" || node?.type === "text-to-image" || node?.type === "image-to-image"
    })

    return {
      sourceNodes,
      targetNodes,
      textNodes,
      imageNodes,
    }
  }, [getEdges, getNodes, id])

  // Create wrapper functions that call the centralized store
  const updateContentWrapper = useCallback(
    (content: string) => {
      // Update local state for the hook consumers
      setTextContent(content)
      
      // Use the centralized store to update and propagate
      updateNodeContent(id, content)
    },
    [id, updateNodeContent],
  )

  const updateImageWrapper = useCallback(
    (url: string) => {
      // Update local state for the hook consumers
      setImageUrl(url)
      
      // Use the centralized store to update and propagate
      updateNodeImage(id, url)
    },
    [id, updateNodeImage],
  )

  // Initialize state based on node data
  useEffect(() => {
    // Find this node to get its current data
    const thisNode = getNodes().find(node => node.id === id)
    if (thisNode) {
      if (thisNode.data.content && thisNode.data.content !== textContent) {
        setTextContent(thisNode.data.content)
      }
      if (thisNode.data.imageUrl && thisNode.data.imageUrl !== imageUrl) {
        setImageUrl(thisNode.data.imageUrl)
      }
    }
  }, [id, getNodes, textContent, imageUrl])

  return {
    // Connection data
    connectedTextNode: connectedNodes.textNodes[0] || null,
    connectedImageNode: connectedNodes.imageNodes[0] || null,

    // Connected nodes arrays
    connectedTextNodes: connectedNodes.textNodes,
    connectedImageNodes: connectedNodes.imageNodes,

    // Content data
    textContent,
    imageUrl,

    // Functions - using centralized store logic now
    updateNodeContent: updateContentWrapper,
    updateNodeImageUrl: updateImageWrapper,

    // Monitoring status
    hasConnectedSources: connectedNodes.sourceNodes.length > 0,
  }
}

