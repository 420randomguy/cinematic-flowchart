"use client"

import { memo, useState, useEffect } from "react"
import type { NodeProps } from "reactflow"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { VisualMirrorRender } from "@/components/nodes/VisualMirror"

interface RenderNodeData {
  title?: string
  sourceNodeId?: string
  imageUrl?: string
}

function RenderNode({ data, isConnectable, id }: NodeProps<RenderNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const nodes = useFlowchartStore((state) => state.nodes)
  const showContent = useVisualMirrorStore((state) => state.showContent)
  
  // State for render generation
  const [isSubmitting, setIsSubmitting] = useState(true)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  
  // State for content type
  const [isVideoContent, setIsVideoContent] = useState(false)
  
  // Title with default
  const title = data?.title || "RENDER"
  
  // Check the source node type to determine content type
  useEffect(() => {
    if (data.sourceNodeId) {
      const sourceNode = nodes.find(node => node.id === data.sourceNodeId)
      if (sourceNode) {
        // Check if the source node is a video node
        const isVideo = sourceNode.type === "text-to-video" || sourceNode.type === "image-to-video"
        setIsVideoContent(isVideo)
        
        // Set the content URL based on the type
        const newContentUrl = isVideo ? "/akira-animation.gif" : "/sample-image.png"
        
        // If we're already generated, update the content in the store
        if (isGenerated) {
          showContent(id, { imageUrl: newContentUrl })
        }
      }
    }
  }, [data.sourceNodeId, nodes, id, showContent, isGenerated])
  
  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isSubmitting) {
      console.log("[RenderNode] Starting countdown timer")
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          console.log(`[RenderNode] Timer tick: ${prev} seconds remaining`)
          if (prev <= 1) {
            console.log("[RenderNode] Timer complete, setting isGenerated=true")
            if (timer) {
              clearInterval(timer)
              timer = null;
            }
            setIsSubmitting(false)
            setIsGenerated(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      console.log("[RenderNode] Cleaning up timer")
      if (timer) {
        clearInterval(timer)
        timer = null;
      }
    }
  }, []) // Run only on mount

  // Separate effect to update VisualMirror when generation completes
  useEffect(() => {
    // Only update the visual mirror when generation is complete
    if (isGenerated) {
      console.log("[RenderNode] Generation complete, updating VisualMirror")
      const contentType = isVideoContent ? "/akira-animation.gif" : "/sample-image.png"
      showContent(id, { imageUrl: contentType })
    }
  }, [isGenerated, isVideoContent, id, showContent])
  
  return (
    <div className="render-node" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          showImage: true, // Enable image display in BaseNode
        }}
        nodeType="render"
        title={title}
        isConnectable={isConnectable}
      >
        <VisualMirrorRender 
          nodeId={id}
          isSubmitting={isSubmitting}
          timeRemaining={timeRemaining}
          showCompletionBadge={isGenerated}
        />
      </BaseNode>
    </div>
  )
}

export default memo(RenderNode) 