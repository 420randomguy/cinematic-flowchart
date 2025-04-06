"use client"

import { memo, useState, useEffect, useRef, useCallback } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import ModelSelector from "@/components/ui/model-selector"
import { getVideoModelById, getDefaultSettings, getVideoModels } from "@/lib/utils/schema-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * VideoNode Component
 *
 * A node component for video generation that uses schema-based model configuration
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The VideoNode component
 */
function VideoNode({ data, isConnectable, id }: NodeProps) {
  const [quality, setQuality] = useState(80)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5) // 5 seconds for testing
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  // Add a state variable to track completion
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [isNewNode, setIsNewNode] = useState(false)

  // Get ReactFlow instance to manipulate nodes and edges
  const { getNode, getNodes, getEdges, setNodes, setEdges } = useReactFlow()

  // Initialize model state from data or defaults
  const [selectedModelId, setSelectedModelId] = useState(data.modelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState<Record<string, any>>(
    data.modelSettings || getDefaultSettings(selectedModelId),
  )

  // Refs to prevent infinite loops
  const isInitialMount = useRef(true)
  const modelChangeRef = useRef(false)

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

  // Memoized handlers to prevent unnecessary re-renders
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    modelChangeRef.current = true
  }, [])

  const handleSettingsChange = useCallback((settings: Record<string, any>) => {
    setModelSettings(settings)
  }, [])

  // Effect to notify parent of model changes, but only when necessary
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Only call onModelChange if it exists and we have a real change
    if (data.onModelChange && modelChangeRef.current) {
      data.onModelChange(selectedModelId, modelSettings)
      modelChangeRef.current = false
    }
  }, [selectedModelId, modelSettings, data])

  // Function to create a new node based on the current one
  const createNewNode = useCallback(() => {
    // Get the current node
    const currentNode = getNode(id)
    if (!currentNode) return

    // Find the source node (prompt) connected to this node
    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    if (incomingEdges.length === 0) return

    const sourceNodeId = incomingEdges[0].source

    // Create a new node ID
    const newNodeId = `video_${Date.now()}`

    // Calculate position to the right of current node
    const newPosition = {
      x: currentNode.position.x + 300,
      y: currentNode.position.y,
    }

    // Create a copy of the current node data
    const newNodeData = {
      ...data,
      title: `${data.title} (Copy)`,
      isNewNode: true, // Flag to trigger animation
      autoSubmit: true, // Flag to auto-trigger submission
      modelId: selectedModelId,
      modelSettings: modelSettings,
    }

    // Create the new node
    const newNode = {
      id: newNodeId,
      type: "video",
      position: newPosition,
      data: newNodeData,
      style: { ...currentNode.style },
    }

    // Create a new edge connecting the prompt to the new node
    const newEdge = {
      id: `e${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      animated: true,
      style: { stroke: "#444", strokeWidth: 1 },
    }

    // Add the new node and edge
    setNodes((nodes) => [...nodes, newNode])
    setEdges((edges) => [...edges, newEdge])

    // Start generation on the new node
    // Note: We can't directly control the new node's state, but we've set it up with isNewNode flag
  }, [id, data, getNode, getEdges, setNodes, setEdges, selectedModelId, modelSettings])

  // Add a new useEffect to detect and handle autoSubmit flag
  // Add this after the existing useEffect for isNewNode
  useEffect(() => {
    // Check if this node should auto-submit on mount
    if (data.autoSubmit) {
      // Small delay to ensure the node is fully rendered
      const timer = setTimeout(() => {
        setIsSubmitting(true)
        setShowVideo(false)
        setVideoGenerated(false)

        const interval = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 0) {
              clearInterval(interval)
              setTimerInterval(null)
              setIsSubmitting(false)
              setShowVideo(true)
              setVideoGenerated(true)
              return 5
            }
            return prev - 1
          })
        }, 1000)

        setTimerInterval(interval)

        // Clear the autoSubmit flag to prevent re-triggering
        if (data.autoSubmit) {
          data.autoSubmit = false
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [data])

  /**
   * Handle submit button toggle
   */
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      // Cancel the submission
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      setIsSubmitting(false)
      setTimeRemaining(5)
      setShowVideo(false)
    } else if (videoGenerated) {
      // If already generated, create a new node instead of regenerating
      createNewNode()
    } else {
      // Start the submission
      setIsSubmitting(true)
      setShowVideo(false)
      setVideoGenerated(false)
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(interval)
            setTimerInterval(null)
            setIsSubmitting(false)
            setShowVideo(true)
            setVideoGenerated(true)
            return 5
          }
          return prev - 1
        })
      }, 1000) // Update every second for demo purposes
      setTimerInterval(interval)
    }
  }, [isSubmitting, timerInterval, videoGenerated, createNewNode])

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }, [])

  // Get the selected model
  const selectedModel = getVideoModelById(selectedModelId)

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        VIDEO
      </div>

      <div className="absolute -top-2 right-2 z-20">
        <Select value={selectedModelId} onValueChange={handleModelChange}>
          <SelectTrigger className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-[9px] p-0 rounded-sm">
            {getVideoModels().map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Only input handle, no output handle for video nodes */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "50%", left: -8 }}
      />

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">{data.title}</div>

      <div className="flex items-center justify-between border-t border-b border-gray-800/50 py-1.5 my-0.5">
        <button
          onClick={handleSubmitToggle}
          className={`px-2 py-0.5 rounded-sm text-[9px] font-medium tracking-wide uppercase transition-colors duration-200 ${
            isSubmitting
              ? "bg-gray-700/90 border border-gray-600 text-gray-300" // In progress state
              : videoGenerated
                ? "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Completed state with yellow accent for regenerate
                : "bg-gray-800/80 border border-yellow-600/50 text-yellow-300 hover:border-yellow-500/70" // Default state with yellow accent
          }`}
        >
          {isSubmitting ? "Cancel" : videoGenerated ? "Regenerate" : "Submit"}
        </button>

        {isSubmitting && (
          <div className="text-[9px] text-gray-500 tracking-wide">Est. time: {formatTimeRemaining(timeRemaining)}</div>
        )}
      </div>

      {data.showImage && (
        <div className="space-y-1.5">
          <div className="relative aspect-video bg-black rounded-sm overflow-hidden">
            {showVideo ? (
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src="/akira-animation.gif"
                  alt="Generated video"
                  width={260}
                  height={150}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <>
                {data.imageUrl ? (
                  <img
                    src={data.imageUrl || "/placeholder.svg"}
                    alt="Custom uploaded image"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Image src="/sample-image.png" alt="Node preview" width={260} height={150} className="object-cover" />
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

            {/* Dynamic model selector and settings */}
            <ModelSelector
              selectedModelId={selectedModelId}
              onModelChange={handleModelChange}
              settings={modelSettings}
              onSettingsChange={handleSettingsChange}
              className="pt-2"
              data={data}
            />

            <div className="flex justify-end items-center pt-1.5">
              <div className="flex gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                      <Maximize2 className="h-2.5 w-2.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-3xl">
                    <div className="aspect-video w-full overflow-hidden">
                      {data.imageUrl ? (
                        <img
                          src={data.imageUrl || "/placeholder.svg"}
                          alt="Custom uploaded fullscreen"
                          className="object-contain w-full h-full"
                        />
                      ) : showVideo ? (
                        <Image
                          src="/akira-animation.gif"
                          alt="Generated video fullscreen"
                          width={1200}
                          height={675}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <Image
                          src="/sample-image.png"
                          alt="Preview fullscreen"
                          width={1200}
                          height={675}
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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

export default memo(VideoNode)

