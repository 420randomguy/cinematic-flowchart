"use client"

import type React from "react"

import { memo, useState, useEffect, useRef } from "react"
import { Position, type NodeProps, useReactFlow } from "reactflow"
import { Sparkles, Zap } from "lucide-react"
import type { AnalysisNodeData } from "@/types"
import { useFlowchart } from "@/contexts/FlowchartContext"
import { SourceHandle } from "@/components/shared/NodeHandles"
import { createInputProps } from "@/lib/utils/node-interaction"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeSettings } from "@/components/ui/NodeSettings"
import { NodeActions } from "@/components/ui/NodeActions"
import { NodeContent } from "@/components/ui/NodeContent"

/**
 * AnalysisNode Component
 *
 * A node component for text prompts that generate images or videos
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The AnalysisNode component
 */
function AnalysisNode({ data, isConnectable, id }: NodeProps<AnalysisNodeData>) {
  const { handleInputInteraction } = useFlowchart()
  const { setNodes } = useReactFlow()
  const [quality, setQuality] = useState(80)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5) // 5 seconds for testing
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [promptText, setPromptText] = useState(
    data.content ||
      "Create a cinematic close-up shot of a vintage poem page with subtle lighting highlighting the texture of the paper. The scene should evoke a sense of nostalgia and intimacy, with muted tones and soft shadows.",
  )
  const MAX_CHARS = 4000
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Create input props for event handling
  const inputProps = createInputProps(handleInputInteraction)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [promptText])

  /**
   * Handle prompt text change
   */
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    if (text.length <= MAX_CHARS) {
      setPromptText(text)

      // Update the node data with the new content
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  content: text,
                },
              }
            : node,
        ),
      )
    }
  }

  /**
   * Handle submit button toggle
   */
  const handleSubmitToggle = () => {
    if (isSubmitting) {
      // Cancel the submission
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      setIsSubmitting(false)
      setTimeRemaining(5)
      setShowVideo(false)
    } else {
      // Start the submission
      setIsSubmitting(true)
      setShowVideo(false)
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(interval)
            setTimerInterval(null)
            setIsSubmitting(false)
            setShowVideo(true)
            return 5
          }
          return prev - 1
        })
      }, 1000) // Update every second for demo purposes
      setTimerInterval(interval)
    }
  }

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  return (
    <div className="bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm">
      {/* Node header with type label */}
      <NodeHeader title={data.title || "PROMPT TITLE"} type="text" />

      {/* Output handle */}
      <SourceHandle position={Position.Right} isConnectable={isConnectable} />

      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-500">
          <Zap className="h-2.5 w-2.5 text-yellow-600/70" />
          <span className="tracking-wide">xai-org driven</span>
        </div>
      </div>

      <div className="border-t border-b border-gray-800/50 py-1.5 my-0.5 relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={promptText}
            onChange={handlePromptChange}
            className="w-full min-h-[60px] bg-black text-[9px] text-gray-300 p-1.5 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 overflow-hidden prevent-node-drag"
            placeholder="Enter your prompt here..."
            disabled={isSubmitting}
            style={{ height: "auto" }}
            {...inputProps}
          />
          <button className="absolute top-1 right-1 text-gray-400 hover:text-gray-300" title="AI suggestions">
            <Sparkles className="h-3 w-3" />
          </button>
          <div className="absolute bottom-1 right-1 text-[8px] text-gray-500">
            {promptText.length}/{MAX_CHARS}
          </div>
        </div>

        {isSubmitting && (
          <div className="mt-1 text-[9px] text-gray-500 tracking-wide text-right">
            Est. time: {formatTimeRemaining(timeRemaining)}
          </div>
        )}
      </div>

      {data.showImage && (
        <>
          {/* Node content with image or video */}
          <NodeContent data={data} isSubmitting={isSubmitting} isGenerated={showVideo} showVideo={showVideo} />

          {/* Node settings with quality and seed */}
          <NodeSettings quality={quality} setQuality={setQuality} seed={data.seed || "416838458"} />

          {/* Node actions with fullscreen and download buttons */}
          <NodeActions />
        </>
      )}
    </div>
  )
}

export default memo(AnalysisNode)

