"use client"

import { useState, useEffect, useCallback } from "react"
import { useReactFlow } from "reactflow"

interface UseNodeConnectionsProps {
  id: string
  textHandleId?: string
  imageHandleId?: string
}

/**
 * Hook for managing node connections and content synchronization
 */
export function useNodeConnections({
  id,
  textHandleId = "text-input",
  imageHandleId = "image-input",
}: UseNodeConnectionsProps) {
  const [connectedTextNode, setConnectedTextNode] = useState<string | null>(null)
  const [connectedImageNode, setConnectedImageNode] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const { setNodes, getEdges, getNode } = useReactFlow()

  // Update connections and content
  const updateConnections = useCallback(() => {
    const edges = getEdges()

    // Find connected text node
    const textEdge = edges.find(
      (edge) =>
        edge.target === id &&
        (edge.targetHandle === textHandleId || (!edge.targetHandle && getNode(edge.source)?.type === "analysis")),
    )

    if (textEdge) {
      const textNode = getNode(textEdge.source)
      if (textNode && textNode.type === "analysis") {
        setConnectedTextNode(textEdge.source)
        const content = textNode.data?.content || ""
        setTextContent(content)

        // Update the node data with the text content
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: content,
                  },
                }
              : node,
          ),
        )
      } else {
        setConnectedTextNode(null)
        setTextContent("")
      }
    } else {
      setConnectedTextNode(null)
      setTextContent("")
    }

    // Find connected image node
    const imageEdge = edges.find(
      (edge) =>
        (edge.target === id && edge.targetHandle === imageHandleId) ||
        (edge.target === id && !edge.targetHandle && getNode(edge.source)?.type?.includes("image")),
    )

    if (imageEdge) {
      const imageNode = getNode(imageEdge.source)
      if (
        imageNode &&
        (imageNode.type === "image" || imageNode.type === "text-to-image" || imageNode.type.includes("image"))
      ) {
        setConnectedImageNode(imageEdge.source)
        const url = imageNode.data?.imageUrl || null

        // Only update if the URL has changed
        if (url !== imageUrl) {
          setImageUrl(url)

          // Update the node data with the image URL
          if (url) {
            setNodes((nodes) =>
              nodes.map((node) =>
                node.id === id
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        imageUrl: url,
                      },
                    }
                  : node,
              ),
            )
          }
        }
      } else {
        setConnectedImageNode(null)
        setImageUrl(null)
      }
    } else {
      setConnectedImageNode(null)
      setImageUrl(null)

      // Clear the image URL in the node data when disconnected
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  imageUrl: null,
                },
              }
            : node,
        ),
      )
    }
  }, [id, textHandleId, imageHandleId, getEdges, getNode, setNodes, imageUrl])

  // Set up effect to update connections
  useEffect(() => {
    // Initial update
    updateConnections()

    // Set up an interval to check for changes
    const interval = setInterval(updateConnections, 100)

    return () => clearInterval(interval)
  }, [updateConnections])

  return {
    connectedTextNode,
    connectedImageNode,
    textContent,
    imageUrl,
    updateConnections,
  }
}

