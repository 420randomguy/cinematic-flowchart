"use client"

import { memo, useState, useEffect, useCallback } from "react"
import type { NodeProps } from "reactflow"
import { Handle, Position } from "reactflow"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { VisualMirrorRender } from "@/components/nodes/VisualMirror"
import { ActionsSection } from "@/components/nodes/sections/ActionsSection"

// Simple red square data URI for testing
interface RenderNodeData {
  title?: string
  sourceNodeId?: string
  requestId?: string
  isSubmitted?: boolean
  hasGenerated?: boolean
  _connectedAt?: number
  _isConnected?: boolean
}

function RenderNode({ data, isConnectable, id }: NodeProps<RenderNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const nodes = useFlowchartStore((state) => state.nodes)
  const edges = useFlowchartStore((state) => state.edges)
  const { visibleContent, startGeneration, updateGenerationTime, completeGeneration } = useVisualMirrorStore()
  const addAsset = useImageLibraryStore((state) => state.addAsset)
  
  // States
  const [isGenerated, setIsGenerated] = useState(!!data.hasGenerated)
  
  // Directly check for connected edges targeting this node
  const connectedEdges = edges.filter(edge => edge.target === id)
  
  // If the explicit flag is set, use it; otherwise check edges
  // This ensures the connection state persists on refresh
  const isConnectedToOutput = data._isConnected === true || connectedEdges.length > 0
  
  // Determine source node type
  const sourceNode = connectedEdges[0] ? 
    nodes.find(node => node.id === connectedEdges[0].source) : 
    null
  
  // Determine if this is video content
  const isVideoContent = sourceNode?.type === "text-to-video" || sourceNode?.type === "image-to-video"
  
  // Get content URL from VisualMirrorStore
  const currentContent = visibleContent[id]
  const contentUrl = currentContent?.imageUrl
  const isGenerating = currentContent?.isGenerating || false
  
  // Log connection state for debugging
  useEffect(() => {
    console.log(`[RenderNode ${id}] Connected Edges: ${connectedEdges.length}, Connected: ${isConnectedToOutput}`)
    if (sourceNode) {
      console.log(`[RenderNode ${id}] Source Node: ${sourceNode.id} (${sourceNode.type})`)
    }
  }, [id, connectedEdges.length, isConnectedToOutput, sourceNode])
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!isGenerating && !isGenerated) {
      console.log(`[RenderNode ${id}] Starting generation process`)
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
          
          console.log(`[RenderNode ${id}] Generation complete, setting content URL: ${contentUrl}`)
          
          // Update content in VisualMirror store and mark generation as complete
          completeGeneration(id, { imageUrl: contentUrl })
          
          // Check if an asset with this URL already exists in the library
          const savedAssets = useImageLibraryStore.getState().savedAssets;
          const assetExists = savedAssets.some(asset => asset.url === contentUrl);
          
          // Only add the asset if it doesn't already exist
          if (!assetExists) {
            try {
              addAsset({
                url: contentUrl,
                type: isVideoContent ? "video" : "image",
                title: isVideoContent ? "Generated Video" : "Generated Image",
                description: `Generated from ${sourceNode?.type || "unknown"} node`,
              });
              console.log(`[RenderNode ${id}] Added ${isVideoContent ? "video" : "image"} to asset library`);
            } catch (error) {
              console.error(`[RenderNode ${id}] Failed to add to asset library:`, error);
            }
          } else {
            console.log(`[RenderNode ${id}] Asset already exists in library, skipping addition`);
          }
          
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
  }, [isGenerating, isGenerated, isVideoContent, id, startGeneration, updateGenerationTime, completeGeneration, addAsset, sourceNode?.type])
  
  // Listen for isSubmitted flag changes from the submit button
  useEffect(() => {
    // Auto-trigger generation when node is connected to a source node and has been submitted
    if (isConnectedToOutput && data.isSubmitted && !isGenerating && !isGenerated) {
      console.log(`[RenderNode ${id}] Conditions met for auto-submit: isConnectedToOutput=${isConnectedToOutput}, isSubmitted=${data.isSubmitted}`)
      handleSubmit()
    }
  }, [data.isSubmitted, isConnectedToOutput, handleSubmit, isGenerating, isGenerated])
  
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
        style={{ 
          background: '#ffcc00', 
          top: 30,
          width: '12px',
          height: '12px',
          border: '2px solid rgba(255, 204, 0, 0.5)'
        }} 
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="video"
        style={{ 
          background: '#00ccff', 
          top: 60,
          width: '12px',
          height: '12px', 
          border: '2px solid rgba(0, 204, 255, 0.5)',
          zIndex: 10 // Ensure it's above other elements
        }}
        isConnectable={isConnectable}
      />
      
      {/* Add source handles too */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ 
          background: '#ffcc00', 
          top: 30,
          width: '12px',
          height: '12px',
          border: '2px solid rgba(255, 204, 0, 0.5)'
        }}
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
        </div>
      </BaseNode>
    </div>
  )
}

export default memo(RenderNode)