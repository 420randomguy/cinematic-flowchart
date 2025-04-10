"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { NodeProps } from "reactflow"
import { useReactFlow } from 'reactflow';
import type { ImageNodeData } from "@/types"
import { BaseNode } from "@/components/nodes/BaseNode"
import ImageSelectorDialog from "@/components/shared/ImageSelectorDialog"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageHandling } from "@/hooks/useImageHandling"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { Upload } from "lucide-react"

// Create stable selectors outside the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput
const updateNodeImageSelector = (state: any) => state.updateNodeImage

function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  // Add a state to force re-renders
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Use stores with stable selectors
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const updateNodeImage = useFlowchartStore(updateNodeImageSelector)

  // Get functions from visual mirror store
  const { showContent } = useVisualMirrorStore()

  // Get getEdges function from React Flow
  const { getEdges, setNodes } = useReactFlow();
  
  // Update force render counter when image URL changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [id, data.imageUrl]);

  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )

  // Use our consolidated hook
  const { nodeProps } = useMemoizedNodeProps(id, data)
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
  } = useImageHandling({
    id,
    data,
    handleInputInteraction,
    onImageSelect: useCallback((imageUrl: string) => {
        // Update centralized store (handles persistent data propagation)
        updateNodeImage(id, imageUrl);
        
        // Update visual mirror for this node
        showContent(id, { imageUrl });
        
        // Directly update this node's data in ReactFlow to ensure it refreshes
        setNodes((nodes) => 
          nodes.map((node) => 
            node.id === id 
              ? { ...node, data: { ...node.data, imageUrl: imageUrl } }
              : node
          )
        );
        
        // Find connected target nodes and update their visual content
        const currentEdges = getEdges();
        const targetNodeIds = currentEdges
          .filter(edge => edge.source === id)
          .map(edge => edge.target);
          
        // Update visual mirror for each connected target node
        targetNodeIds.forEach(targetId => {
          showContent(targetId, { imageUrl });
        });
      }, [id, updateNodeImage, getEdges, showContent, setNodes]),
  })

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        nodeType="image"
        title={nodeProps.title || "IMAGE"}
        showSourceHandle={true}
        showTargetHandle={false}
        isConnectable={isConnectable}
        contentProps={{
          imageUrl: data.imageUrl,
          isDragging,
          handleDragOver,
          handleDragLeave,
          handleDrop,
          handleClick,
          isSubmitting: false,
          isGenerated: false,
          key: `image-${data.imageUrl || "none"}-${forceUpdate}`,
          category: "image",
        }}
        actionsProps={{
          imageUrl: data.imageUrl,
        }}
      >
        <div 
          className="w-full relative"
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          ref={dropRef}
        >
          {data.imageUrl ? (
            <div className="relative w-full h-full min-h-[80px] flex items-center justify-center">
              <img 
                src={data.imageUrl} 
                alt="Uploaded content"
                className="object-cover max-w-full max-h-full" 
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-900/20 transition-colors">
              <Upload className="h-5 w-5 mb-2 text-gray-500" />
              <div className="text-[9px] text-gray-500 text-center">Click to select or drag image</div>
            </div>
          )}
        </div>
      </BaseNode>

      {/* Image selector dialog */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        savedImages={savedImages}
        onSelectImage={selectImage}
        onFileUpload={handleFileUpload}
        handleInputInteraction={handleInputInteraction}
      />
    </>
  )
}

export default memo(ImageNode)

