"use client"

import type React from "react"

import { memo, type ReactNode, useEffect, useRef, useCallback, useMemo } from "react"
import { Position, useReactFlow } from "reactflow"
import { NodeWrapper } from "@/components/shared/NodeWrapper"
import { NodeHeaderSection } from "@/components/nodes/sections/NodeHeaderSection"
import { SubmitButton } from "@/components/ui/submit-button"
import { NodeContent } from "@/components/nodes/NodeContent"
import { NodeSettings } from "@/components/ui/node-settings"
import { NodeActions } from "@/components/ui/NodeActions"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"
import { useNodeEvents } from "@/hooks/useNodeEvents"
import { TextPreview } from "@/components/ui/text-preview"
import ImagePreview from "@/components/ui/image-preview"
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

  // Extract properties from contentProps for SubmitButton and NodeContent
  const { isSubmitting, isGenerated, timeRemaining, handleSubmitToggle, ...restContentProps } = contentProps

  // Determine if this is an output node (nodes that process inputs)
  const isOutputNode = useMemo(() => {
    // Assuming 'text', 'url', 'image' are pure input nodes
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

  // Renamed and updated function to check for any valid source connection
  const hasConnectedSourceNode = useCallback(() => {
    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    for (const edge of incomingEdges) {
      const sourceNode = getNodes().find((node) => node.id === edge.source)
      // Check for text, url, or image source types
      if (
        sourceNode &&
        (sourceNode.type === "text" || sourceNode.type === "url" || sourceNode.type === "image")
      ) {
        return true
      }
    }
    return false
  }, [id, getEdges, getNodes])

  // Check specifically if a TEXT or URL node is connected
  const isTextNodeConnected = useCallback(() => {
    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    for (const edge of incomingEdges) {
      const sourceNode = getNodes().find((node) => node.id === edge.source)
      if (sourceNode && (sourceNode.type === "text" || sourceNode.type === "url")) {
        return true
      }
    }
    return false
  }, [id, getEdges, getNodes])()

  // Get content and image URL from propagated data - Keep for potential use by other nodes
  // const displayContent = data.sourceNodeContent || ""
  // const displayImageUrl = data.sourceImageUrl || null

  // Check if a valid source node is connected - Keep for handle logic etc.
  const isSourceNodeConnected = hasConnectedSourceNode()

  // Determine text content for preview from props or data
  const previewTextContent = contentProps.textContent ?? (data.sourceNodeContent || "");

  // Determine if there's preview content (connected image or connected text) to show
  const hasPreviewContent = !!data.sourceImageUrl || isTextNodeConnected; // Show preview container if either image OR text is connected

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

  // Create a default submit handler if none is provided
  const defaultSubmitHandler = useCallback(() => {
    // Default behavior for submit button if no handler is provided
  }, [])

  const sourceHandleId = "output"

  return (
    <NodeWrapper id={id} type={nodeType} isNewNode={data.isNewNode} onClick={handleNodeClick} ref={nodeRef}>
      {/* Node header with type label and model selector */}
      <NodeHeaderSection
        title={propsRef.current.title}
        type={propsRef.current.nodeType}
        modelId={propsRef.current.modelId}
        onModelChange={onModelChange}
      />

      {/* Submit button - Conditionally Rendered */}
      {handleSubmitToggle && (
         <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5 px-2">
          <SubmitButton
            isSubmitting={isSubmitting}
            isGenerated={isGenerated}
            onClick={handleSubmitToggle}
            timeRemaining={timeRemaining}
          />
        </div>
      )}

      {/* Preview Area - Render only if output node and has connected content */}
      {isOutputNode && hasPreviewContent && (
        <div className="px-1.5 pb-1 space-y-1">
          {/* Image Preview - Use data.sourceImageUrl */} 
          {data.sourceImageUrl && <ImagePreview imageUrl={data.sourceImageUrl} />}  
          
          {/* Text Preview - Only show if text node is connected */}
          {isTextNodeConnected && (
            <TextPreview
              text={data.sourceNodeContent || ""} // Directly use propagated content
              isConnected={true} // Already checked isTextNodeConnected
              showIfEmpty={true} // Show even if previewTextContent is empty initially
              emptyText="Text node connected" // Update placeholder
              maxLength={30} // Optional: Adjust length
              // Add top border only if image preview is also shown above it
              className={`${data.sourceImageUrl ? 'border-t border-gray-800/30 pt-1' : ''}`}
            />
          )}
        </div>
      )}

      {/* Dynamic Node Content Area (e.g., image output) */}
      <NodeContent data={data} {...restContentProps} isSubmitting={isSubmitting} isGenerated={isGenerated} />

      {/* Children (e.g., specific inputs/settings for derived nodes) */}
      {children}

      {/* Node settings with quality, seed, and size */}
      {data.showImage && Object.keys(settingsProps).length > 0 && <NodeSettings {...settingsProps} />}

      {/* Node actions with fullscreen and download buttons */}
      {data.showImage && Object.keys(actionsProps).length > 0 && <NodeActions {...actionsProps} />}

      {/* Handles */}
      {propsRef.current.showTargetHandle &&
        propsRef.current.targetHandleIds.map((handleId) => (
          <TargetHandle
            key={handleId}
            id={handleId}
            position={Position.Left}
            isConnectable={propsRef.current.isConnectable}
            handleType={getHandleType(handleId)} // Pass handle type for color
          />
        ))}
      {propsRef.current.showSourceHandle && (
        <SourceHandle
          position={Position.Right}
          isConnectable={propsRef.current.isConnectable}
          handleType={getSourceHandleType()} // Pass handle type for color
          id={sourceHandleId}
        />
      )}
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
    prevProps.contentProps?.imageUrl === nextProps.contentProps?.imageUrl &&
    // Compare propagated data for previews
    prevProps.data?.sourceImageUrl === nextProps.data?.sourceImageUrl &&
    prevProps.data?.sourceNodeContent === nextProps.data?.sourceNodeContent
  )
})

