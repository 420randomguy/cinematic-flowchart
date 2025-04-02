"use client"

import type React from "react"

import { memo, useState, useEffect, useRef } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download, Sparkles, Zap } from "lucide-react"
import type { AnalysisNodeData } from "@/types"
import { useFlowchart } from "@/contexts/FlowchartContext"

/**
 * AnalysisNode Component
 *
 * A node component for text prompts that generate images or videos
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The AnalysisNode component
 */
function AnalysisNode({ data, isConnectable }: NodeProps<AnalysisNodeData>) {
  const { handleInputInteraction } = useFlowchart()
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
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        TEXT
      </div>

      {/* Only output handle, no input handle for prompt nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "50%", right: -8 }}
      />

      <div className="flex items-center justify-between mb-0.5">
        <div className="font-bold text-[10px] text-gray-400 tracking-wide uppercase">
          {data.title || "PROMPT TITLE"}
        </div>
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
            onMouseEnter={() => handleInputInteraction(true)}
            onMouseLeave={() => handleInputInteraction(false)}
            onFocus={() => handleInputInteraction(true)}
            onBlur={() => handleInputInteraction(false)}
            onMouseDown={(e) => {
              e.stopPropagation()
              // Prevent ReactFlow from capturing this event for node dragging
              e.nativeEvent.stopImmediatePropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onCopy={(e) => e.stopPropagation()}
            onCut={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
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
        <div className="space-y-1.5">
          <div className="relative aspect-video bg-black rounded-sm overflow-hidden">
            {showVideo ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px]">
                <p>Video will play here</p>
              </div>
            ) : (
              <>
                <img src="/sample-image.png" alt="Node preview" className="object-cover w-full h-full" />
                {data.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-yellow-300/90 text-[9px] font-mono tracking-wide">
                    {data.caption}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1 pt-1 border-t border-gray-800/50">
            <div className="flex justify-between items-center">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">QUALITY</div>
              <div className="text-[9px] text-gray-400">{quality}</div>
            </div>
            <Slider
              value={[quality]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => setQuality(value[0])}
              className="w-full h-1.5"
            />

            <div className="flex justify-between items-center pt-1">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
              <div className="text-[9px] text-gray-400 font-mono">{data.seed || "416838458"}</div>
            </div>

            <div className="flex justify-end items-center pt-1.5">
              <div className="flex gap-1">
                <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                  <Maximize2 className="h-2.5 w-2.5" />
                </button>
                <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                  <Download className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(AnalysisNode)

