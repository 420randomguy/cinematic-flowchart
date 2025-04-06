"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useReactFlow } from "reactflow"
import { useConnectionStore } from "@/store/useConnectionStore"

// Create stable selectors outside the hook
const getNodeContentSelector = (state: any) => state.getNodeContent
const getNodeImageUrlSelector = (state: any) => state.getNodeImageUrl
const updateNodeContentSelector = (state: any) => state.updateNodeContent
const updateNodeImageUrlSelector = (state: any) => state.updateNodeImageUrl

/**
 * Unified hook for handling node connections and content monitoring
 */
export function useNodeConnections({
  id,
  textHandleId = "text",
  imageHandleId = "image",
  loraHandleId = "lora",
}: {
  id: string
  textHandleId?: string
  imageHandleId?: string
  loraHandleId?: string
}) {
  // State for content
  const [textContent, setTextContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loraContent, setLoraContent] = useState<string | null>(null)

  // ReactFlow hooks
  const { setNodes, getNodes, getEdges } = useReactFlow()

  // Connection store with stable selectors
  const getNodeContent = useConnectionStore(getNodeContentSelector)
  const getNodeImageUrl = useConnectionStore(getNodeImageUrlSelector)
  const updateNodeContent = useConnectionStore(updateNodeContentSelector)
  const updateNodeImageUrl = useConnectionStore(updateNodeImageUrlSelector)

  // Get connected nodes using ReactFlow's getEdges directly
  const connectedNodes = useMemo(() => {
    const edges = getEdges()

    // Get source nodes (nodes that connect to this node)
    const sourceNodes = edges.filter((edge) => edge.target === id).map((edge) => edge.source)

    // Get target nodes (nodes that this node connects to)
    const targetNodes = edges.filter((edge) => edge.source === id).map((edge) => edge.target)

    // Get nodes by type
    const nodes = getNodes()
    const textNodes = sourceNodes.filter((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.type === "text" || node?.type === "url"
    })

    const imageNodes = sourceNodes.filter((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.type === "image" || node?.type === "text-to-image" || node?.type === "image-to-image"
    })

    const loraNodes = sourceNodes.filter((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.type === "url"
    })

    return {
      sourceNodes,
      targetNodes,
      textNodes,
      imageNodes,
      loraNodes,
    }
  }, [getEdges, getNodes, id])

  // Listen for content updates from connected nodes
  useEffect(() => {
    const handleContentUpdate = (event: CustomEvent) => {
      const { sourceNodeId, content, targetNodeIds } = event.detail

      // Check if this node is a target of the update
      if (targetNodeIds.includes(id)) {
        setTextContent(content)

        // Update the node data
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: content,
                    _lastUpdated: Date.now(),
                  },
                }
              : node,
          ),
        )
      }
    }

    // Listen for content updates
    window.addEventListener("flowchart-content-update", handleContentUpdate as EventListener)

    return () => {
      window.removeEventListener("flowchart-content-update", handleContentUpdate as EventListener)
    }
  }, [id, setNodes])

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

  // Check for initial content from connected nodes
  useEffect(() => {
    if (connectedNodes.textNodes.length > 0) {
      const sourceNodeId = connectedNodes.textNodes[0]
      const content = getNodeContent(sourceNodeId)

      if (content && content !== textContent) {
        setTextContent(content)

        // Update the node data
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: content,
                    _lastUpdated: Date.now(),
                  },
                }
              : node,
          ),
        )
      }
    }
  }, [connectedNodes.textNodes, getNodeContent, id, setNodes, textContent])

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

  // Function to update node content
  const updateContent = useCallback(
    (content: string) => {
      if (content !== textContent) {
        setTextContent(content)
        updateNodeContent(id, content)
      }
    },
    [id, textContent, updateNodeContent],
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
    connectedLoraNode: connectedNodes.loraNodes[0] || null,

    // Connected nodes arrays
    connectedTextNodes: connectedNodes.textNodes,
    connectedImageNodes: connectedNodes.imageNodes,
    connectedLoraNodes: connectedNodes.loraNodes,

    // Content data
    textContent,
    imageUrl,
    loraContent,

    // Functions
    updateNodeContent: updateContent,
    updateNodeImageUrl: updateImage,

    // Monitoring status
    hasConnectedSources: connectedNodes.sourceNodes.length > 0,
  }
}

