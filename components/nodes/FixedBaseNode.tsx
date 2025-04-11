"use client"

import React from "react"
import type { CSSProperties } from "react"

import { memo, type ReactNode, useEffect, useRef, useCallback, useMemo } from "react"
import { Position, useReactFlow } from "reactflow"
import { NodeWrapper } from "@/components/shared/NodeWrapper"
import { NodeHeaderSection } from "@/components/nodes/sections/NodeHeaderSection"
import { SubmitButton } from "@/components/ui/submit-button"
import { NodeSettings } from "@/components/ui/node-settings"
import { NodeActions } from "@/components/ui/NodeActions"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"
import { useNodeEvents } from "@/hooks/useNodeEvents"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { VisualMirrorText, VisualMirrorImage } from "@/components/nodes/VisualMirror"

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
  externalHandles?: boolean // Flag to indicate handles are managed externally
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
  externalHandles = false,
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

  // Extract ONLY props needed DIRECTLY by BaseNode
  const { 
    isSubmitting,
    isGenerated,
    timeRemaining,
    handleSubmitToggle,
  } = contentProps

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

  // Determine if there's preview content (connected/propagated image or text) to show
  const hasSourceContent = !!data.sourceNodeContent;
  const hasSourceImage = !!data.sourceImageUrl;

  // Explicitly log the content being used
  useEffect(() => {
    if (isOutputNode) {
      console.log(`[BaseNode ${id}] sourceNodeContent:`, data.sourceNodeContent);
      console.log(`[BaseNode ${id}] contentProps.textContent:`, contentProps.textContent);
      console.log(`[BaseNode ${id}] isTextNodeConnected:`, isTextNodeConnected);
      console.log(`[BaseNode ${id}] hasPreviewContent:`, hasSourceContent, hasSourceImage);
    }
  }, [id, isOutputNode, data.sourceNodeContent, contentProps.textContent, isTextNodeConnected, hasSourceContent, hasSourceImage]);

  // Add a reactive check for text content presence
  const hasTextContent = !!data.sourceNodeContent && data.sourceNodeContent.trim().length > 0;

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
    if (nodeType === "text-to-video" || nodeType === "image-to-video") return "video"
    return undefined
  }

  // Create a default submit handler if none is provided
  const defaultSubmitHandler = useCallback(() => {
    // Default behavior for submit button if no handler is provided
  }, [])

  // Get the correct source handle ID based on node type
  const getSourceHandleId = () => {
    if (nodeType === "text") return "text"
    if (nodeType === "image" || nodeType === "text-to-image" || nodeType === "image-to-image") return "image"
    if (nodeType === "text-to-video" || nodeType === "image-to-video") return "video"
    return "output"
  }

  const sourceHandleId = getSourceHandleId()

  // Determine if children are provided
  const hasChildren = React.Children.count(children) > 0

  // Determine if NodeContent should be rendered
  // Only render for output nodes or when specific output-related props are present
  const shouldRenderNodeContent = !data.skipNodeContent && (isOutputNode || 
    Object.keys(contentProps).some(key => ['outputImageUrl'].includes(key))) && 
    (!hasChildren || contentProps.onContentChange !== null)

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
         <div className="flex items-center justify-between px-2">
          <SubmitButton nodeId={id} />
        </div>
      )}

      {/* NodeContent - Replace with VisualMirror components */}
      {shouldRenderNodeContent && (
        <div className="node-content-container">
          {/* Use VisualMirrorText for any source content from text nodes */}
          {hasSourceContent && <VisualMirrorText nodeId={id} />}
          
          {/* Use VisualMirrorImage for displaying images */}
          {(data.showImage || hasSourceImage || data.imageUrl) && (
            <div className={`relative ${isSubmitting ? 'opacity-50' : ''}`}>
              <VisualMirrorImage 
                nodeId={id} 
                hidePrompt={nodeType === "text-to-image" || nodeType === "text-to-video" || true} 
              />
            </div>
          )}
          
          {/* For image upload nodes, add the drag-drop event handlers */}
          {nodeType === "image" && contentProps.handleDrop && (
            <div 
              className="absolute inset-0 z-10"
              onDragOver={contentProps.handleDragOver}
              onDragLeave={contentProps.handleDragLeave}
              onDrop={contentProps.handleDrop}
              onClick={contentProps.handleClick}
            />
          )}
        </div>
      )}

      {/* Children (e.g., specific inputs/settings for derived nodes) */}
      {children}

      {/* Node settings with quality, seed, and size */}
      {data.showImage && Object.keys(settingsProps).length > 0 && <NodeSettings {...settingsProps} />}

      {/* Node actions with fullscreen and download buttons */}
      {data.showImage && Object.keys(actionsProps).length > 0 && <NodeActions {...actionsProps} />}

      {/* Handles - Only render if not using external handles */}
      {!externalHandles && (
        <>
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
        </>
      )}
    </NodeWrapper>
  )
}

// Export component directly
export const BaseNode = BaseNodeComponent; 