"use client"

import { memo, useState, useEffect, useCallback, useMemo } from "react"
import type { NodeProps } from "reactflow"
import { Handle, Position } from "reactflow"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { VisualMirrorRender } from "@/components/nodes/VisualMirror"
import { ActionsSection } from "@/components/nodes/sections/ActionsSection"

// Simple red square data URI for testing
interface RenderNodeData {
  title?: string
  sourceNodeId?: string
  requestId?: string
  isSubmitted?: boolean
  hasGenerated?: boolean
}

function RenderNode({ data, isConnectable, id }: NodeProps<RenderNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const nodes = useFlowchartStore((state) => state.nodes)
  const edges = useFlowchartStore((state) => state.edges)
  const { visibleContent, startGeneration, updateGenerationTime, completeGeneration } = useVisualMirrorStore()
  
  // States
  const [isGenerated, setIsGenerated] = useState(!!data.hasGenerated)
  
  // Check if connected to an output-producing node
  const { isConnectedToOutput, sourceNodeType } = useMemo(() => {
    const connectedEdge = edges.find(edge => edge.target === id)
    if (!connectedEdge) return { isConnectedToOutput: false, sourceNodeType: null }
    
    const sourceNode = nodes.find(node => node.id === connectedEdge.source)
    if (!sourceNode) return { isConnectedToOutput: false, sourceNodeType: null }
    
    const isValidSource = [
      "output", 
      "text-to-image", 
      "image-to-image",
      "text-to-video", 
      "image-to-video"
    ].includes(sourceNode.type as string)
    
    return { 
      isConnectedToOutput: isValidSource, 
      sourceNodeType: isValidSource ? sourceNode.type : null
    }
  }, [edges, nodes, id])
  
  // Determine if this is video content
  const isVideoContent = useMemo(() => {
    return sourceNodeType === "text-to-video" || sourceNodeType === "image-to-video"
  }, [sourceNodeType])
  
  // Get content URL from VisualMirrorStore
  const currentContent = visibleContent[id]
  const contentUrl = currentContent?.imageUrl
  const isGenerating = currentContent?.isGenerating || false
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!isGenerating && !isGenerated) {
      // Start generation in VisualMirror store
      startGeneration(id)
      
      // 5 second countdown handled by the store
      let time = 5
      const interval = setInterval(() => {
        time--
        // Update time remaining in the store
        updateGenerationTime(id, time)
        
        if (time <= 0) {
          clearInterval(interval)
          
          // Use local test files based on source node type
          const contentUrl = isVideoContent
            ? "/testvideo.mp4"
            : "/testimage.jpg";
          
          // Update content in VisualMirror store and mark generation as complete
          completeGeneration(id, { imageUrl: contentUrl })
          
          // Update node data to remember that generation has occurred
          useFlowchartStore.getState().setNodes(nodes => 
            nodes.map(node => 
              node.id === id ? {
                ...node,
                data: {
                  ...node.data,
                  hasGenerated: true
                }
              } : node
            )
          )
          
          // Set isGenerated flag
          setIsGenerated(true)
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isGenerating, isGenerated, isVideoContent, id, startGeneration, updateGenerationTime, completeGeneration])
  
  // Listen for isSubmitted flag changes from the submit button
  useEffect(() => {
    // Auto-trigger generation when node is connected to a source node and has been submitted
    if (isConnectedToOutput && data.isSubmitted && !isGenerating && !isGenerated) {
      handleSubmit()
    }
  }, [data, isConnectedToOutput, handleSubmit, isGenerating, isGenerated])
  
  // Sync with data.hasGenerated
  useEffect(() => {
    if (data.hasGenerated && !isGenerated) {
      setIsGenerated(true)
    }
  }, [data.hasGenerated, isGenerated])
  
  return (
    <div className="render-node relative" onMouseDown={() => setIsInteractingWithInput(false)}>
      {/* Handles for ReactFlow connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        style={{ background: '#ffcc00', top: 30 }} 
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="video"
        style={{ background: '#00ccff', top: 60 }}
        isConnectable={isConnectable}
      />
      
      <BaseNode
        id={id}
        data={{
          ...data,
          skipNodeContent: true,
        }}
        nodeType="render"
        title={data.title || "RENDER"}
        showSourceHandle={false}
        showTargetHandle={false}
        externalHandles={true}
        isConnectable={isConnectable}
      >
        <div className="w-full h-full">
          {!isConnectedToOutput ? (
            <div className="flex flex-col items-center justify-center p-4 min-h-[120px]">
              <div className="text-[11px] text-gray-400 text-center">Connect to Output</div>
            </div>
          ) : (
            <>
              <VisualMirrorRender 
                nodeId={id} 
                showCompletionBadge={isGenerated && !isGenerating}
                showControls={false}
              />
              
              {/* Always show actions section */}
              <div className="border-t border-gray-800/50 mt-2">
                <ActionsSection 
                  imageUrl={contentUrl || ""} 
                  showVideo={isVideoContent}
                  className="px-2" 
                  nodeId={id}
                />
              </div>
            </>
          )}
        </div>
      </BaseNode>
    </div>
  )
}

export default memo(RenderNode)