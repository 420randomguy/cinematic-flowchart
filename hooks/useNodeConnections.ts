"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useReactFlow } from "reactflow"
import { useConnectionStore } from "@/store/useConnectionStore"

// Create stable selectors outside the hook
const getNodeContentSelector = (state: any) => state.getNodeContent
const getNodeImageUrlSelector = (state: any) => state.getNodeImageUrl
const updateNodeImageUrlSelector = (state: any) => state.updateNodeImageUrl

/**
 * Unified hook for handling node connections and content monitoring
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
  // Use ReactFlow and ConnectionStore hooks
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const getNodeContent = useConnectionStore(getNodeContentSelector)
  const getNodeImageUrl = useConnectionStore(getNodeImageUrlSelector)
  const updateNodeImageUrl = useConnectionStore(updateNodeImageUrlSelector)

  // Local state for content
  const [textContent, setTextContent] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Get connected nodes
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

  // Listen for image updates from connected nodes
  useEffect(() => {
    const handleImageUpdate = (event: CustomEvent) => {
      const { sourceNodeId, imageUrl, targetNodeIds } = event.detail

      // Check if this node is a target of the update
      if (targetNodeIds.includes(id)) {
        setImageUrl(imageUrl)

        // Update the node data
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    imageUrl: imageUrl,
                    _lastUpdated: Date.now(),
                  },
                }
              : node,
          ),
        )
      }
    }

    // Listen for image updates
    window.addEventListener("flowchart-image-update", handleImageUpdate as EventListener)

    return () => {
      window.removeEventListener("flowchart-image-update", handleImageUpdate as EventListener)
    }
  }, [id, setNodes])

  // Check for initial image from connected nodes
  useEffect(() => {
    if (connectedNodes.imageNodes.length > 0) {
      const sourceNodeId = connectedNodes.imageNodes[0]

      // Get the node directly from ReactFlow
      const nodes = getNodes()
      const sourceNode = nodes.find((n) => n.id === sourceNodeId)

      if (sourceNode?.data?.imageUrl) {
        const url = sourceNode.data.imageUrl

        if (url && url !== imageUrl) {
          setImageUrl(url)

          // Update the node data
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      imageUrl: url,
                      _lastUpdated: Date.now(),
                    },
                  }
                : node,
            ),
          )
        }
      }
    }
  }, [connectedNodes.imageNodes, getNodes, id, imageUrl, setNodes])

  // Function to update node content AND PROPAGATE VIA setNodes
  const updateContent = useCallback(
    (content: string) => {
      // Update local state if needed
      setTextContent(content)

      // ADD direct propagation via ReactFlow
      setNodes((nodes) =>
        nodes.map((node) => {
          // Find nodes that have this node (id) as a source
          const isTarget = getEdges().some((edge) => edge.source === id && edge.target === node.id)
          if (isTarget) {
            return {
              ...node,
              data: {
                ...node.data,
                sourceNodeContent: content, // Set the source content
                _lastUpdated: Date.now(),
              },
            }
          }
          return node
        }),
      )
    },
    [id, getEdges, setNodes], // Update dependencies
  )

  // Function to update node image URL
  const updateImage = useCallback(
    (url: string) => {
      if (url !== imageUrl) {
        setImageUrl(url)
        updateNodeImageUrl(id, url)
      }
    },
    [id, imageUrl, updateNodeImageUrl],
  )

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

    // Functions
    updateNodeContent: updateContent,
    updateNodeImageUrl: updateImage,

    // Monitoring status
    hasConnectedSources: connectedNodes.sourceNodes.length > 0,
  }
}

