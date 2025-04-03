"use client"

import { memo, useEffect, useState } from "react"
import { Position, type NodeProps, useReactFlow } from "reactflow"
import { Upload } from "lucide-react"
import type { ImageNodeData } from "@/types"
import { useImageHandling } from "@/hooks/useImageHandling"
import { SourceHandle } from "@/components/shared/NodeHandles"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeSettings } from "@/components/ui/NodeSettings"
import { NodeActions } from "@/components/ui/NodeActions"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchart } from "@/contexts/FlowchartContext"
import { createInputProps, createInteractiveProps } from "@/lib/utils/node-interaction"

/**
 * BasicImageNode Component
 *
 * A node component for displaying images
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The BasicImageNode component
 */
function BasicImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const { handleInputInteraction } = useFlowchart()
  const { setNodes } = useReactFlow()
  const [isNewNode, setIsNewNode] = useState(false)
  const [quality, setQuality] = useState(80)
  const inputProps = createInputProps(handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

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

  // Debug function to ensure click is working
  const handleDebugClick = () => {
    console.log("Image clicked, opening selector")
    setShowImageSelector(true)
  }

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      {/* Node header with type label */}
      <NodeHeader title={data.title || "IMAGE"} type="image" />

      {/* Output handle */}
      <SourceHandle position={Position.Right} isConnectable={isConnectable} />

      <div className="space-y-1.5">
        {/* Image upload area */}
        <div
          ref={dropRef}
          className={`relative aspect-video bg-black rounded-sm overflow-hidden cursor-pointer ${
            isDragging ? "bg-gray-800/50 border-2 border-dashed border-yellow-300/50" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDebugClick} // Direct click handler without interactiveProps
        >
          {data.imageUrl ? (
            // When we have an image, show it but keep it clickable for replacement
            <div className="relative w-full h-full">
              <img src={data.imageUrl || "/placeholder.svg"} alt="Image" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="text-[9px] text-white text-center">Click to replace image</div>
              </div>
            </div>
          ) : (
            // When no image, show the upload prompt
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <div className="text-[9px] text-gray-400 text-center">Click to select from library or drag and drop</div>
            </div>
          )}

          {data.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300 text-[9px] font-mono tracking-wide">
              {data.caption}
            </div>
          )}
        </div>

        <div className="space-y-1 pt-1 border-t border-gray-800/50">
          {/* Caption input */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">CAPTION</div>
            <input
              type="text"
              value={data.caption || ""}
              onChange={(e) => {
                const updatedData = {
                  ...data,
                  caption: e.target.value,
                }
                setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
              }}
              className="bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0.5 w-[160px] focus:outline-none focus:ring-1 focus:ring-gray-700"
              placeholder="Add a caption..."
              {...inputProps}
            />
          </div>

          {/* Node settings with size selector */}
          <NodeSettings
            quality={quality}
            setQuality={setQuality}
            seed={data.seed || "416838458"}
            showSizeSelector={true}
            defaultSize="16:9"
          />

          {/* Node actions with fullscreen and download buttons */}
          <NodeActions imageUrl={data.imageUrl} />
        </div>
      </div>

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

export default memo(BasicImageNode)

