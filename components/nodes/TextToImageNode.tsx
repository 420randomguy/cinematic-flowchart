"use client"

import { memo, useState, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useNodeState } from "@/hooks/useNodeState"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { VisualMirror } from "@/components/nodes/VisualMirror"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// REMOVED event detail structure
// interface FlowchartContentUpdateDetail { ... }
// interface FlowchartImageUpdateDetail { ... }

function TextToImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)

  // REMOVED State for real-time display from events
  // const [displayedText, setDisplayedText] = useState<string | null>(null)
  // const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null)

  // Get functions from the visual mirror store
  const { showContent, clearContent } = useVisualMirrorStore()

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
    handleSubmitToggle: originalHandleSubmitToggle,
  } = useNodeState({
    id,
    data,
  })
  
  // Get connected node content directly from props (updated by store)
  // const { textContent: connectedTextContentViaHook } = useNodeConnections({ id })
  
  // REMOVED Initialization effect
  // useEffect(() => { ... }, [...])

  // REMOVED Effect for handling real-time updates via events
  // useEffect(() => { ... }, [id])

  // Create a submit handler that updates local state
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      setIsSubmitting(false)
      setTimeRemaining(5)
    } else if (isGenerated) {
      // Handle regeneration
      setIsSubmitting(true)
      setIsGenerated(false)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    } else {
      // Handle initial generation
      setIsSubmitting(true)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    }

    // Call the original handler if it exists
    if (originalHandleSubmitToggle) {
      originalHandleSubmitToggle()
    }
  }, [isSubmitting, isGenerated, originalHandleSubmitToggle])

  // Determine the text to display directly from props.data (updated by store)
  const textToDisplay = data.sourceNodeContent || data.content || ""
  // Determine the source image URL directly from props.data
  const sourceImageUrlToDisplay = data.sourceImageUrl || data.imageUrl || null
  // This node GENERATES an image, its output is in data.imageUrl
  const outputImageUrl = data.imageUrl

  // Update the visual mirror store when data changes
  useEffect(() => {
    // Check if we have required data for this node
    const hasValidData = !!textToDisplay || !!sourceImageUrlToDisplay
    
    if (hasValidData) {
      // Update visual mirror with current content
      showContent(id, {
        text: textToDisplay,
        imageUrl: sourceImageUrlToDisplay || undefined
      })
    } else {
      // Clear visual mirror if no valid data
      clearContent(id)
    }
  }, [id, textToDisplay, sourceImageUrlToDisplay, showContent, clearContent])

  // Determine if we have text input from any source for potential logic/display changes
  const hasConnectedText = !!textToDisplay

  return (
    <>
      <div className="relative">
        <BaseNode
          id={id}
          data={{
            ...data,
            // Pass the store-managed source content down to BaseNode
            sourceNodeContent: textToDisplay,
            sourceImageUrl: sourceImageUrlToDisplay, // Pass the determined source image
            // Pass the generated image URL (output)
            imageUrl: outputImageUrl,
          }}
          nodeType="text-to-image"
          title={data.title || "TEXT-TO-IMAGE"}
          showSourceHandle={true}
          showTargetHandle={true}
          // Accept text or image input handles
          targetHandleIds={["text", "image"]}
          isConnectable={isConnectable}
          modelId={selectedModelId}
          onModelChange={handleModelChange}
          contentProps={{
            // Pass down the relevant props for NodeContent
            // NodeContent expects imageUrl for generated/output display
            imageUrl: outputImageUrl,
            // NodeContent also uses textContent for display if needed (though BaseNode handles preview)
            textContent: textToDisplay,
            // Pass sourceImageUrl for potential use in NodeContent if it adapts
            sourceImageUrl: sourceImageUrlToDisplay,
            category: "text-to-image",
            isSubmitting,
            isGenerated,
            timeRemaining,
            handleSubmitToggle,
          }}
          settingsProps={{
            quality,
            setQuality,
            seed,
            selectedModelId,
            modelSettings,
            handleModelChange,
            handleSettingsChange,
            handleSubmitToggle,
          }}
          actionsProps={{
            // Actions relate to the *output* image
            imageUrl: outputImageUrl,
          }}
        />
        
        {/* Visual Mirror component to display mirrored content */}
        <VisualMirror nodeId={id} />
      </div>
    </>
  )
}

export default memo(TextToImageNode)

