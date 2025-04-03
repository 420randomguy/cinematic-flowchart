"use client"

import { useState, useCallback, useEffect } from "react"
import { useReactFlow } from "reactflow"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import { useContext } from "react"

interface UseNodeStateProps {
  id: string
  data: any
  initialQuality?: number
  initialStrength?: number
  initialSeed?: number | string
  modelId?: string
  modelSettings?: Record<string, any>
}

/**
 * Comprehensive hook for managing node state
 * Handles all common node functionality including submission, generation, and animation
 */
export function useNodeState({
  id,
  data,
  initialQuality = 80,
  initialStrength = 70,
  initialSeed,
  modelId: initialModelId,
  modelSettings: initialModelSettings,
}: UseNodeStateProps) {
  // Basic state
  const [quality, setQuality] = useState(initialQuality)
  const [strength, setStrength] = useState(initialStrength)
  const [seed, setSeed] = useState(initialSeed || data.seed || Math.floor(Math.random() * 1000000000).toString())
  const [isNewNode, setIsNewNode] = useState(!!data.isNewNode)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [isGenerated, setIsGenerated] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // Model state
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || "flux-dev")
  const [modelSettings, setModelSettings] = useState<Record<string, any>>(initialModelSettings || {})

  // Content state
  const [sourceNodeContent, setSourceNodeContent] = useState<string | null>(data.sourceNodeContent || null)

  // ReactFlow hooks
  const { setNodes, getEdges, getNode } = useReactFlow()

  // Context
  const { addAsset } = useContext(ImageLibraryContext)

  // Set animation class for new nodes
  useEffect(() => {
    if (data.isNewNode) {
      setIsNewNode(true)
      // Remove the animation class after animation completes
      const timer = setTimeout(() => {
        setIsNewNode(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [data.isNewNode])

  // Auto-submit if flagged
  useEffect(() => {
    if (data.autoSubmit) {
      const timer = setTimeout(() => {
        handleSubmit()
        if (data.autoSubmit) {
          // Clear the flag to prevent re-triggering
          data.autoSubmit = false
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data])

  // Check for connected prompt nodes and update content in real-time
  useEffect(() => {
    const updateConnections = () => {
      const edges = getEdges()
      let isConnected = false

      // Find if there's a prompt node connected to this node
      const promptEdge = edges.find((edge) => edge.target === id)

      if (promptEdge && promptEdge.source) {
        const sourceNode = getNode(promptEdge.source)
        if (sourceNode && sourceNode.type === "analysis") {
          isConnected = true
          // Update the node data with source node's content
          const sourceContent = sourceNode.data?.content || ""

          // Always update to ensure real-time sync
          setSourceNodeContent(sourceContent)
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      sourceNodeContent: sourceContent,
                    },
                  }
                : node,
            ),
          )
        }
      }

      // If no valid connection found, clear the source content
      if (!isConnected && sourceNodeContent !== null) {
        setSourceNodeContent(null)
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: null,
                  },
                }
              : node,
          ),
        )
      }
    }

    // Initial update
    updateConnections()

    // Set up an interval to check for changes
    const interval = setInterval(updateConnections, 500)

    return () => clearInterval(interval)
  }, [id, sourceNodeContent, setNodes, getEdges, getNode])

  // Function to create a new node based on the current one
  const createNewNode = useCallback(() => {
    // Get the current node
    const currentNode = getNode(id)
    if (!currentNode) return

    // Find the source node (prompt) connected to this node
    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    if (incomingEdges.length === 0) return

    const sourceNodeId = incomingEdges[0].source

    // Create a new node ID
    const newNodeId = `${data.category}_${Date.now()}`

    // Calculate position to the right of current node
    const newPosition = {
      x: currentNode.position.x + 300,
      y: currentNode.position.y,
    }

    // Create a copy of the current node data
    const newNodeData = {
      ...data,
      title: `${data.title} (Copy)`,
      isNewNode: true, // Flag to trigger animation
      autoSubmit: true, // Flag to auto-trigger submission
      modelId: selectedModelId,
      modelSettings: modelSettings,
      seed: Math.floor(Math.random() * 1000000000).toString(), // Generate new seed
    }

    // Create the new node
    const newNode = {
      id: newNodeId,
      type: currentNode.type,
      position: newPosition,
      data: newNodeData,
      style: { ...currentNode.style },
    }

    // Create a new edge connecting the prompt to the new node
    const newEdge = {
      id: `e${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      animated: true,
      style: { stroke: "#444", strokeWidth: 1 },
    }

    // Add the new node and edge
    setNodes((nodes) => [...nodes, newNode])
    setNodes((edges) => [...edges, newEdge])
  }, [id, data, getNode, getEdges, setNodes, selectedModelId, modelSettings])

  // Handle submission
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true)
    setShowResult(false)
    setIsGenerated(false)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          setTimerInterval(null)
          setIsSubmitting(false)
          setShowResult(true)
          setIsGenerated(true)

          // Save the generated asset to the asset board if it's a video or image
          if (data.category === "video" || data.category === "image" || data.category.includes("image")) {
            addAsset({
              url: data.category === "video" ? "/akira-animation.gif" : "/sample-image.png",
              type: data.category === "video" ? "video" : "image",
              title: data.title || `Generated ${data.category}`,
              description: data.sourceNodeContent || data.content || "",
              settings: {
                modelId: selectedModelId,
                modelSettings: modelSettings,
                seed: seed,
                quality: quality,
                strength: strength,
              },
            })
          }

          return 5
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)
  }, [data, selectedModelId, modelSettings, seed, quality, strength, addAsset])

  // Handle submit button toggle
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      // Cancel the submission
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      setIsSubmitting(false)
      setTimeRemaining(5)
      setShowResult(false)
    } else if (isGenerated) {
      // If already generated, create a new node instead of regenerating
      createNewNode()
    } else {
      // Start the submission
      handleSubmit()
    }
  }, [isSubmitting, timerInterval, isGenerated, createNewNode, handleSubmit])

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }, [])

  // Handle model change
  const handleModelChange = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId)

      // Update the node data with the new model
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  modelId: modelId,
                },
              }
            : node,
        ),
      )
    },
    [id, setNodes],
  )

  // Handle settings change
  const handleSettingsChange = useCallback(
    (settings: Record<string, any>) => {
      setModelSettings(settings)

      // Update the node data with the new settings
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  modelSettings: settings,
                },
              }
            : node,
        ),
      )
    },
    [id, setNodes],
  )

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  return {
    // State
    quality,
    strength,
    seed,
    isNewNode,
    isSubmitting,
    timeRemaining,
    isGenerated,
    showResult,
    selectedModelId,
    modelSettings,
    sourceNodeContent,

    // Setters
    setQuality,
    setStrength,
    setSeed,
    setSelectedModelId,
    setModelSettings,

    // Handlers
    handleSubmit,
    handleSubmitToggle,
    handleModelChange,
    handleSettingsChange,
    createNewNode,
    formatTimeRemaining,
  }
}

