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
import { VisualMirrorImage } from "@/components/nodes/VisualMirror"

// Create stable selectors outside the component
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput
const updateNodeImageSelector = (state: any) => state.updateNodeImage

function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  // Add a state to force re-renders
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Use stores with stable selectors
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const updateNodeImage = useFlowchartStore(updateNodeImageSelector)

  // Get functions from visual mirror store and its content
  const { showContent, visibleContent } = useVisualMirrorStore()
  const visualData = visibleContent[id] || {}
  
  // Check if we have an image in either the visual mirror or data prop
  const hasImage = !!visualData.imageUrl || !!data.imageUrl

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
  
  // Enhanced drag handler for better image replacement
  const enhancedDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragOver(e);
  }, [handleDragOver]);
  
  // Enhanced drop handler to ensure image replacement works consistently
  const enhancedDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;
          // Always update both the store AND visual mirror for consistency
          updateNodeImage(id, imageUrl);
          showContent(id, { imageUrl });
          
          // Update React Flow node data
          setNodes((nodes) => 
            nodes.map((node) => 
              node.id === id 
                ? { ...node, data: { ...node.data, imageUrl } }
                : node
            )
          );
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Call original handler as fallback
    handleDrop(e);
  }, [id, updateNodeImage, showContent, setNodes, handleDrop]);

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
          handleDragOver: enhancedDragOver,
          handleDragLeave,
          handleDrop: enhancedDrop,
          handleClick,
          isSubmitting: false,
          isGenerated: false,
          key: `image-${data.imageUrl || "none"}-${forceUpdate}`,
          category: "image",
        }}
        actionsProps={{
          imageUrl: data.imageUrl,
          nodeId: id,
        }}
      >
        <div 
          className="w-full relative"
          onClick={handleClick}
          onDragOver={enhancedDragOver}
          onDragLeave={handleDragLeave}
          onDrop={enhancedDrop}
          ref={dropRef}
        >
          {/* Use VisualMirrorImage with hidePrompt=true to prevent showing "Connect image node" text */}
          <div className="visual-mirror-wrapper custom-image-node">
            <VisualMirrorImage nodeId={id} hidePrompt={true} />
          </div>
          
          {/* Only show upload prompt when no image exists in both store and data */}
          {!hasImage && (
            <div className="absolute inset-0 w-full h-full min-h-[80px] flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-900/20 transition-colors">
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

