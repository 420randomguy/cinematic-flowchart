"use client"

import type React from "react"

import { memo, type ReactNode, useEffect, useRef, useCallback, useMemo } from "react"
import { Position } from "reactflow"
import { NodeWrapper } from "@/components/shared/NodeWrapper"
import { NodeHeader } from "@/components/ui/node-header"
import { SubmitButton } from "@/components/ui/submit-button"
import { NodeContent } from "@/components/ui/node-content"
import { NodeSettings } from "@/components/ui/node-settings"
import { NodeActions } from "@/components/ui/NodeActions"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"
import { useNodeEvents } from "@/hooks/useNodeEvents"
import { TextPreview } from "@/components/ui/text-preview"
import { useReactFlow } from "reactflow"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Simple DOM read function to replace the deleted utility
const scheduleDOMRead = (fn: () => any) => requestAnimationFrame(fn)

interface BaseNodeProps {
  id: string
  data: any
  nodeType: string
  title: string
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  targetHandleIds?: string[]
  isConnectable?: boolean
  modelId?: string
  onModelChange?: (modelId: string) => void
  contentProps?: any
  settingsProps?: any
  actionsProps?: any
  children?: ReactNode
}

// Create stable selector outside the component
const handleInputInteractionSelector = (state: any) => state.setIsInteractingWithInput

function BaseNodeComponent({
  id,
  data,
  nodeType,
  title,
  showSourceHandle = false,
  showTargetHandle = true,
  targetHandleIds = ["text"],
  isConnectable = true,
  modelId,
  onModelChange,
  contentProps = {},
  settingsProps = {},
  actionsProps = {},
  children,
}: BaseNodeProps) {
  // Use the node events hook for selection, deletion, etc.
  const { handleNodeSelect } = useNodeEvents(id)
  const { getEdges, getNodes } = useReactFlow()

  // Use our DOM measurements hook instead of a simple ref
  const nodeRef = useRef<HTMLDivElement>(null)
  const dimensions = useRef({ width: 0, height: 0 })

  const measure = useCallback(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect()
      if (data.onResize) {
        data.onResize({
          id,
          width: rect.width,
          height: rect.height,
        })
      }
      return rect
    }
    return null
  }, [data, id])

  // Track if the component has mounted
  const hasMounted = useRef(false)

  // Cache props to prevent unnecessary re-renders
  const propsRef = useRef({
    id,
    nodeType,
    title,
    showSourceHandle,
    showTargetHandle,
    targetHandleIds,
    isConnectable,
    modelId,
  })

  // Update cached props only when they change
  if (
    id !== propsRef.current.id ||
    nodeType !== propsRef.current.nodeType ||
    title !== propsRef.current.title ||
    showSourceHandle !== propsRef.current.showSourceHandle ||
    showTargetHandle !== propsRef.current.showTargetHandle ||
    isConnectable !== propsRef.current.isConnectable ||
    modelId !== propsRef.current.modelId ||
    targetHandleIds.length !== propsRef.current.targetHandleIds.length ||
    targetHandleIds.some((id, i) => id !== propsRef.current.targetHandleIds[i])
  ) {
    propsRef.current = {
      id,
      nodeType,
      title,
      showSourceHandle,
      showTargetHandle,
      targetHandleIds,
      isConnectable,
      modelId,
    }
  }

  // Extract properties from contentProps for SubmitButton
  const { isSubmitting, isGenerated, timeRemaining } = contentProps

  // Extract handleSubmitToggle from settingsProps if available
  // If not available in settingsProps, check contentProps as a fallback
  const handleSubmitToggle =
    settingsProps.handleSubmitToggle || contentProps.handleSubmitToggle || data.handleSubmitToggle

  // Determine if this is an output node
  const isOutputNode = useMemo(() => {
    return nodeType !== "text" && nodeType !== "url" && nodeType !== "image"
  }, [nodeType])

  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(handleInputInteractionSelector)
  
  // Create properly memoized handler for input interaction
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting);
    },
    [setIsInteractingWithInput]
  );

  // Also fix the hasConnectedTextNode implementation
  const hasConnectedTextNode = useCallback(() => {
    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    for (const edge of incomingEdges) {
      const sourceNode = getNodes().find((node) => node.id === edge.source)
      if (sourceNode && (sourceNode.type === "text" || sourceNode.type === "url")) {
        return true
      }
    }
    return false
  }, [id, getEdges, getNodes])

  // Get content to display - prioritize sourceNodeContent if available
  const displayContent = data.sourceNodeContent || ""

  // Check if a text node is connected
  const isTextNodeConnected = hasConnectedTextNode()

  // Optimized function to set up DOM references
  const setupDOMReferences = useCallback(() => {
    // If we have a dropRef in contentProps, set it to the node content container
    if (contentProps.dropRef && nodeRef.current) {
      scheduleDOMRead(() => {
        try {
          const contentContainer = nodeRef.current?.querySelector(".node-content-container")
          if (contentContainer && contentProps.dropRef) {
            contentProps.dropRef.current = contentContainer
          }
        } catch (error) {
          console.warn("Error setting up DOM references:", error)
        }
      })
    }
  }, [contentProps.dropRef, nodeRef])

  // Effect to set up DOM references after render - only run once after mount
  useEffect(() => {
    if (hasMounted.current) return

    // Mark as mounted immediately
    hasMounted.current = true

    // Use requestAnimationFrame for visual setup
    requestAnimationFrame(() => {
      try {
        setupDOMReferences()
      } catch (error) {
        console.warn("Error in post-mount setup:", error)
      }
    })

    // Use setTimeout for measurements
    setTimeout(() => {
      try {
        if (nodeRef.current) {
          measure()
        }
      } catch (error) {
        console.warn("Error measuring node:", error)
      }
    }, 0)
  }, [setupDOMReferences, measure])

  // Handle node click with DOM optimizations
  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      handleNodeSelect()
    },
    [handleNodeSelect],
  )

  // Map handle IDs to handle types for color coding
  const getHandleType = (handleId: string) => {
    if (handleId === "text") return "text"
    if (handleId === "image") return "image"
    if (handleId === "lora") return "lora"
    return undefined
  }

  // Determine source handle type based on node type
  const getSourceHandleType = () => {
    if (nodeType === "text") return "text"
    if (nodeType === "image" || nodeType === "text-to-image" || nodeType === "image-to-image") return "image"
    if (nodeType === "url") return "lora"
    return undefined
  }

  // For output nodes, simplify to just have a single text input handle
  const simplifiedTargetHandleIds = isOutputNode ? ["text"] : targetHandleIds

  // Create a default submit handler if none is provided
  const defaultSubmitHandler = useCallback(() => {
    // Default behavior for submit button if no handler is provided
  }, [])

  const sourceHandleId = "output"

  return (
    <NodeWrapper id={id} type={nodeType} isNewNode={data.isNewNode} onClick={handleNodeClick} ref={nodeRef}>
      {/* Node header with type label and model selector */}
      <NodeHeader
        title={title || data.title || nodeType.toUpperCase()}
        type={nodeType}
        modelId={modelId || data.modelId}
        onModelChange={onModelChange}
      />

      {/* Input handles - simplified for output nodes */}
      {showTargetHandle &&
        simplifiedTargetHandleIds.map((handleId) => (
          <TargetHandle
            key={handleId}
            position={Position.Left}
            id={handleId}
            isConnectable={isConnectable}
            handleType={getHandleType(handleId)}
          />
        ))}

      {/* Output handle - only visible when specified or generated */}
      {(showSourceHandle || isGenerated) && (
        <SourceHandle
          position={Position.Right}
          id={sourceHandleId}
          isConnectable={isConnectable}
          handleType={getSourceHandleType()}
        />
      )}

      {/* Submit button for output nodes - ALWAYS show for output nodes */}
      {isOutputNode && (
        <SubmitButton
          isSubmitting={isSubmitting || false}
          isGenerated={isGenerated || false}
          onClick={handleSubmitToggle || defaultSubmitHandler}
          timeRemaining={timeRemaining || 5}
        />
      )}

      {/* Node content with image/video - using SharedNodeContent instead of NodeContent */}
      {data.showImage && <NodeContent data={data} {...contentProps} />}

      {/* Display text preview for output nodes - ALWAYS show for output nodes */}
      {isOutputNode && (
        <TextPreview
          text={displayContent || data.sourceNodeContent}
          nodeId={id}
          maxLength={25}
          showIfEmpty={true}
          emptyText="Connect text node"
          isConnected={isTextNodeConnected}
          className="mt-2 border-t border-gray-800/30 pt-2"
        />
      )}

      {/* Node settings with quality, seed, and size */}
      {data.showImage && Object.keys(settingsProps).length > 0 && <NodeSettings {...settingsProps} />}

      {/* Node actions with fullscreen and download buttons */}
      {data.showImage && Object.keys(actionsProps).length > 0 && <NodeActions {...actionsProps} />}

      {/* Additional custom content */}
      {children}
    </NodeWrapper>
  )
}

// Optimized comparison function for BaseNode
export const BaseNode = memo(BaseNodeComponent, (prevProps, nextProps) => {
  // Fast path: reference equality
  if (prevProps === nextProps) return true

  // Compare only the props that affect rendering
  return (
    prevProps.id === nextProps.id &&
    prevProps.nodeType === nextProps.nodeType &&
    prevProps.title === nextProps.title &&
    prevProps.showSourceHandle === nextProps.showSourceHandle &&
    prevProps.showTargetHandle === nextProps.showTargetHandle &&
    prevProps.isConnectable === nextProps.isConnectable &&
    prevProps.modelId === nextProps.modelId &&
    prevProps.data.title === nextProps.data.title &&
    prevProps.data.showImage === nextProps.data.showImage &&
    prevProps.data.isNewNode === nextProps.data.isNewNode &&
    // Only compare content props that affect rendering
    prevProps.contentProps?.isSubmitting === nextProps.contentProps?.isSubmitting &&
    prevProps.contentProps?.isGenerated === nextProps.contentProps?.isGenerated &&
    prevProps.contentProps?.showVideo === nextProps.contentProps?.showVideo &&
    prevProps.contentProps?.imageUrl === nextProps.contentProps?.imageUrl
  )
})

