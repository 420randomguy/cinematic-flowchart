"use client"

import { useState, useCallback, useEffect, useMemo, useRef, useContext } from "react"
import { useReactFlow } from "reactflow"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { useConnections } from "@/contexts/ConnectionContext"
import { handleDragOver as utilHandleDragOver, handleDragLeave as utilHandleDragLeave } from "@/lib/utils/drag-drop"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// ==========================================
// Node State Hook
// ==========================================
export function useNodeState({
  id,
  data,
  initialQuality = 80,
  initialStrength = 70,
  initialSeed,
  modelId: initialModelId,
  modelSettings: initialModelSettings,
  onStateChange,
  autoSubmit = false,
}) {
  // Basic state
  const [quality, setQuality] = useState(data.quality || initialQuality)
  const [strength, setStrength] = useState(data.strength || initialStrength)
  const [seed, setSeed] = useState(initialSeed || data.seed || Math.floor(Math.random() * 1000000000).toString())
  const [isNewNode, setIsNewNode] = useState(!!data.isNewNode)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [timerInterval, setTimerInterval] = useState(null)
  const [isGenerated, setIsGenerated] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // Model state
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || data.modelId || "flux-dev")
  const [modelSettings, setModelSettings] = useState(initialModelSettings || data.modelSettings || {})

  // ReactFlow hooks
  const { setNodes, getNode, getNodes, getEdges } = useReactFlow()

  // Context
  const addAsset = useImageLibraryStore((state) => state.addAsset)

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
    if (autoSubmit || data.autoSubmit) {
      const timer = setTimeout(() => {
        handleSubmit()
        if (data.autoSubmit) {
          // Clear the flag to prevent re-triggering
          data.autoSubmit = false
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data, autoSubmit])

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
              url:
                data.category === "video" || data.category.includes("video")
                  ? "/akira-animation.gif"
                  : "/sample-image.png",
              type: data.category === "video" || data.category.includes("video") ? "video" : "image",
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

  // Function to create a new node based on the current one
  const createNewNode = useCallback(() => {
    // Get the current node
    const currentNode = getNode(id)
    if (!currentNode) return

    // Create a new node ID
    const newNodeId = `${data.category || "node"}_${Date.now()}`

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

    // Add the new node
    setNodes((nodes) => [...nodes, newNode])

    // Return the new node ID for potential connections
    return newNodeId
  }, [id, data, getNode, setNodes, selectedModelId, modelSettings])

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
  const formatTimeRemaining = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }, [])

  // Handle model change
  const handleModelChange = useCallback(
    (modelId) => {
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
    (settings) => {
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

  // Update content
  const updateContent = useCallback(
    (content) => {
      // Update this node's content
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, content } } : node)))

      // Get all edges where this node is the source
      const edges = getEdges().filter((edge) => edge.source === id)

      // For each connected node, update its sourceNodeContent
      edges.forEach((edge) => {
        // Get the target node
        const targetNode = getNodes().find((node) => node.id === edge.target)
        if (!targetNode) return

        // Update target node with content
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === edge.target
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
      })
    },
    [id, getEdges, getNodes, setNodes],
  )

  // Update image
  const updateImage = useCallback(
    (imageUrl) => {
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, imageUrl } } : node)))
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
    nodeProps,

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
    updateContent,
    updateImage,
  }
}

// ==========================================
// Image Handling Hook
// ==========================================
export function useImageHandling({ id, data, onImageSelect, onImageUpload, onDragStateChange, initialImageUrl }) {
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedImage, setSelectedImage] = useState(initialImageUrl || null)
  const dropRef = useRef(null)
  const { savedImages, addImage, savedAssets } = useContext(ImageLibraryContext)
  const { setNodes } = useReactFlow()

  // Enhanced drag over handler with state update
  const handleDragOver = useCallback(
    (e) => {
      const result = utilHandleDragOver(e)
      setIsDragging(true)
      onDragStateChange?.(true)
      return result
    },
    [onDragStateChange],
  )

  // Enhanced drag leave handler with state update
  const handleDragLeave = useCallback(
    (e) => {
      const result = utilHandleDragLeave(e)
      setIsDragging(false)
      onDragStateChange?.(false)
      return result
    },
    [onDragStateChange],
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      onDragStateChange?.(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result

            // Save the image to the library
            addImage(imageUrl)
            setSelectedImage(imageUrl)

            // Use the provided callback if available
            if (onImageUpload) {
              onImageUpload(file, imageUrl)
              return
            }

            // Otherwise, update the node data directly
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [data, id, setNodes, addImage, onImageUpload, onDragStateChange],
  )

  const handleClick = useCallback(() => {
    setShowImageSelector(true)
  }, [])

  const selectImage = useCallback(
    (imageUrl) => {
      setSelectedImage(imageUrl)

      // Use the provided callback if available
      if (onImageSelect) {
        onImageSelect(imageUrl)
        setShowImageSelector(false)
        return
      }

      // Otherwise, update the node data directly
      const updatedData = {
        ...data,
        imageUrl: imageUrl,
      }

      // Update the node in ReactFlow
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
      setShowImageSelector(false)
    },
    [data, id, setNodes, onImageSelect],
  )

  const handleFileUpload = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result

            // Save the image to the library
            addImage(imageUrl)
            setSelectedImage(imageUrl)

            // Use the provided callback if available
            if (onImageUpload) {
              onImageUpload(file, imageUrl)
              setShowImageSelector(false)
              return
            }

            // Otherwise, update the node data directly
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
      setShowImageSelector(false)
    },
    [data, id, setNodes, addImage, onImageUpload],
  )

  return {
    isDragging,
    showImageSelector,
    setShowImageSelector,
    selectedImage,
    setSelectedImage,
    dropRef,
    savedImages,
    savedAssets,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    selectImage,
    handleFileUpload,
  }
}

// ==========================================
// Node Connections Hook
// ==========================================
export function useNodeConnections({ id, textHandleId = "text", imageHandleId = "image", loraHandleId = "lora" }) {
  const [textContent, setTextContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loraContent, setLoraContent] = useState(null)
  const { setNodes, getNodes, getEdges } = useReactFlow()
  const { connectionLookup, getNodeContent, getNodeImageUrl } = useConnections()
  const { showContent } = useVisualMirrorStore()
  
  // Source nodes we've found
  let sourceNodeIds = []

  // Get connected text nodes (text nodes)
  const connectedTextNodes = useMemo(() => {
    return connectionLookup.getConnectedNodesOfType(id, "text", "source")
  }, [connectionLookup, id])

  // Get connected image nodes
  const connectedImageNodes = useMemo(() => {
    const imageNodeTypes = ["image", "text-to-image", "image-to-image"]
    return connectionLookup.getSourceNodes(id).filter((nodeId) => {
      const nodeType = connectionLookup.getNodeType(nodeId)
      return nodeType && imageNodeTypes.includes(nodeType)
    })
  }, [connectionLookup, id])

  // Get connected lora nodes
  const connectedLoraNodes = useMemo(() => {
    return connectionLookup.getConnectedNodesOfType(id, "url", "source")
  }, [connectionLookup, id])

  // Update text content when connected text node changes
  useEffect(() => {
    if (connectedTextNodes.length > 0) {
      const content = getNodeContent(connectedTextNodes[0])
      if (content) {
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
  }, [connectedTextNodes, getNodeContent, id, setNodes])

  // Update image URL when connected image node changes
  useEffect(() => {
    if (connectedImageNodes.length > 0) {
      const url = getNodeImageUrl(connectedImageNodes[0])
      if (url) {
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
  }, [connectedImageNodes, getNodeImageUrl, id, setNodes])

  // Update lora content when connected lora node changes
  useEffect(() => {
    if (connectedLoraNodes.length > 0) {
      const content = getNodeContent(connectedLoraNodes[0])
      if (content) {
        setLoraContent(content)
      }
    }
  }, [connectedLoraNodes, getNodeContent])

  // Function to directly check for content changes in source nodes
  const checkSourceNodesForContent = useCallback(() => {
    if (sourceNodeIds.length === 0) {
      // If no source nodes specified, use connection lookup
      const sources = connectionLookup.getSourceNodes(id)
      sourceNodeIds = sources
    }

    // Get current nodes
    const nodes = getNodes()

    // Check each source node for content
    for (const sourceId of sourceNodeIds) {
      const sourceNode = nodes.find((node) => node.id === sourceId)
      if (sourceNode?.data?.content) {
        // Found content, update it
        setTextContent(sourceNode.data.content)

        // Update the VisualMirror store instead of node data
        showContent(id, { text: sourceNode.data.content })

        return true
      }
    }

    return false
  }, [id, connectionLookup, getNodes, setTextContent, showContent])

  return {
    connectedTextNode: connectedTextNodes[0] || null,
    connectedImageNode: connectedImageNodes[0] || null,
    connectedLoraNode: connectedLoraNodes[0] || null,
    textContent,
    imageUrl,
    loraContent,
    refreshContent: checkSourceNodesForContent,
    monitoredContent: textContent,
  }
}

// ==========================================
// Node Events Hook
// ==========================================
export function useNodeEvents(id, options = {}) {
  const { setNodes, getNode } = useReactFlow()

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

    // Call custom onSelect handler if provided
    options.onSelect?.()
  }, [id, setNodes, options])

  // Handle node deletion
  const handleNodeDelete = useCallback(() => {
    // Call custom onDelete handler if provided
    if (options.onDelete) {
      options.onDelete()
      return
    }

    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }, [id, setNodes, options])

  // Get the duplicateNode function from the store
  const duplicateNode = useFlowchartStore((state) => state.duplicateNode)

  // Handle node duplication
  const handleNodeDuplicate = useCallback(() => {
    // Call custom onDuplicate handler if provided
    if (options.onDuplicate) {
      options.onDuplicate()
      return
    }

    // Use the centralized store function
    duplicateNode(id)
  }, [id, duplicateNode, options])

  // Handle keyboard events for the selected node
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }
}

// ==========================================
// Model Settings Hook
// ==========================================
export function useModelSettings(initialModelId, initialSettings, onModelChange) {
  // Initialize model state from data or defaults
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState(initialSettings || {})

  // Refs to prevent infinite loops
  const isInitialMount = useRef(true)
  const modelChangeRef = useRef(false)

  // Memoized handlers to prevent unnecessary re-renders
  const handleModelChange = useCallback((modelId) => {
    setSelectedModelId(modelId)
    modelChangeRef.current = true
  }, [])

  const handleSettingsChange = useCallback((settings) => {
    setModelSettings(settings)
  }, [])

  // Effect to notify parent of model changes, but only when necessary
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Only call onModelChange if it exists and we have a real change
    if (onModelChange && modelChangeRef.current) {
      onModelChange(selectedModelId, modelSettings)
      modelChangeRef.current = false
    }
  }, [selectedModelId, modelSettings, onModelChange])

  return {
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
  }
}

// Export for backward compatibility - but we'll use the direct hooks now
export const useMemoizedNodeProps = (id, data) => {
  const { nodeProps, updateContent, updateImage } = useNodeState({ id, data })
  return { nodeProps, updateContent, updateImage }
}

