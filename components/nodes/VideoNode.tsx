"use client"

import { memo } from "react"
import { Position, type NodeProps } from "reactflow"
import type { VideoNodeData } from "@/types"
import { useNodeState } from "@/hooks/useNodeState"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { TargetHandle, HiddenHandle } from "@/components/shared/NodeHandles"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeContent } from "@/components/ui/NodeContent"
import { NodeSettings } from "@/components/ui/NodeSettings"
import { NodeActions } from "@/components/ui/NodeActions"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchart } from "@/contexts/FlowchartContext"

/**
 * VideoNode Component
 *
 * A node component for video generation that uses schema-based model configuration
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The VideoNode component
 */
function VideoNode({ data, isConnectable, id }: NodeProps<VideoNodeData>) {
  const { handleInputInteraction } = useFlowchart()

  // Use the node state hook for managing state
  const {
    quality,
    setQuality,
    seed,
    isNewNode,
    isSubmitting,
    timeRemaining,
    isGenerated,
    showResult,
    selectedModelId,
    modelSettings,
    handleSubmitToggle,
    handleModelChange,
    handleSettingsChange,
    formatTimeRemaining,
  } = useNodeState({
    id,
    data,
    initialModelId: data.modelId || "wan-pro",
    initialModelSettings: data.modelSettings,
  })

  // Use the image handling hook for image selection and upload
  const {
    isDragging,
    showImageSelector,
    setShowImageSelector,
    dropRef,
    savedImages,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    selectImage,
    handleFileUpload,
  } = useImageHandling({ id, data })

  // Use the node connections hook to track connected nodes
  const { textContent, imageUrl } = useNodeConnections({
    id,
    textHandleId: "video-text-input",
    imageHandleId: "video-image-input",
  })

  // Determine if we should show the video
  const showVideo = isGenerated && showResult

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      {/* Node header with type label and model selector */}
      <NodeHeader title={data.title} type="video" modelId={selectedModelId} onModelChange={handleModelChange} />

      {/* Main input handle */}
      <TargetHandle position={Position.Left} isConnectable={isConnectable} />

      {/* Hidden handles for specific connection types */}
      <HiddenHandle type="target" position={Position.Left} isConnectable={isConnectable} id="video-text-input" />
      <HiddenHandle type="target" position={Position.Left} isConnectable={isConnectable} id="video-image-input" />

      {/* Submit button */}
      <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
        <button
          onClick={handleSubmitToggle}
          className={`px-2 py-0.5 rounded-sm text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
            isSubmitting
              ? "bg-gray-700/90 border border-gray-600 text-gray-300" // In progress state
              : isGenerated
                ? "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Completed state with yellow accent for regenerate
                : "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Default state with yellow accent
          }`}
        >
          {isSubmitting ? "Cancel" : isGenerated ? "Regenerate" : "Submit"}
        </button>

        {isSubmitting && (
          <div className="text-[9px] text-gray-500 tracking-wide">Est. time: {formatTimeRemaining(timeRemaining)}</div>
        )}
      </div>

      {data.showImage && (
        <>
          {/* Node content with video, image, or text */}
          <NodeContent
            data={data}
            isSubmitting={isSubmitting}
            isGenerated={isGenerated}
            showVideo={showVideo}
            imageUrl={imageUrl || data.imageUrl}
            textContent={textContent}
            isDragging={false}
            dropRef={null}
            handleDragOver={undefined}
            handleDragLeave={undefined}
            handleDrop={undefined}
            handleClick={undefined}
          />

          {/* Node settings with quality, seed, and model settings */}
          <NodeSettings
            quality={quality}
            setQuality={setQuality}
            seed={seed}
            selectedModelId={selectedModelId}
            modelSettings={modelSettings}
            handleModelChange={handleModelChange}
            handleSettingsChange={handleSettingsChange}
            data={data}
          />

          {/* Node actions with fullscreen and download buttons */}
          <NodeActions imageUrl={imageUrl || data.imageUrl} showVideo={showVideo} />
        </>
      )}

      {/* Image selector dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        savedImages={savedImages}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
      />
    </div>
  )
}

export default memo(VideoNode)

