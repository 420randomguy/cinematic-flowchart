"use client"

import { memo, useState } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import Image from "next/image"
import { Slider } from "@/components/ui/slider"
import { Maximize2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { ImageNodeData } from "@/types"
import { useNodeActions } from "@/hooks/useNodeActions"
import { SubmitButton } from "@/components/ui/SubmitButton"
import { NodeHeader } from "@/components/ui/NodeHeader"
import { NodeContent } from "@/components/ui/NodeContent"

/**
 * ImageNode Component
 *
 * A node component for image generation
 *
 * @param {NodeProps} props - The node props from ReactFlow
 * @returns {JSX.Element} The ImageNode component
 */
function ImageNode({ data, isConnectable, id }: NodeProps<ImageNodeData>) {
  const [quality, setQuality] = useState(80)
  const [selectedModel, setSelectedModel] = useState("flux-dev")

  const { isSubmitting, timeRemaining, showResult, isGenerated, isNewNode, handleSubmitToggle } = useNodeActions({
    id,
    data,
  })

  return (
    <div
      className={`bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm ${isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""}`}
    >
      <NodeHeader title={data.title} type="image" modelId={selectedModel} onModelChange={setSelectedModel} />

      {/* Only input handle, no output handle for image nodes */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-1.5 h-1.5 bg-gray-600 border-gray-600"
        style={{ top: "50%", left: -8 }}
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        isGenerated={isGenerated}
        onClick={handleSubmitToggle}
        timeRemaining={timeRemaining}
      />

      {data.showImage && (
        <NodeContent data={data} isSubmitting={isSubmitting} isGenerated={isGenerated} showVideo={false}>
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

            {/* Add size selector */}
            <div className="flex justify-between items-center pt-1">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">SIZE</div>
              <Select defaultValue="16:9">
                <SelectTrigger className="h-5 w-[60px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0">
                  <SelectValue placeholder="16:9" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
                  <SelectItem value="16:9" className="text-[9px] py-1 px-2 text-gray-300">
                    16:9
                  </SelectItem>
                  <SelectItem value="9:16" className="text-[9px] py-1 px-2 text-gray-300">
                    9:16
                  </SelectItem>
                  <SelectItem value="3:4" className="text-[9px] py-1 px-2 text-gray-300">
                    3:4
                  </SelectItem>
                  <SelectItem value="4:3" className="text-[9px] py-1 px-2 text-gray-300">
                    4:3
                  </SelectItem>
                  <SelectItem value="1:1" className="text-[9px] py-1 px-2 text-gray-300">
                    1:1
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add prompt preview */}
            {data.content && (
              <div className="text-[9px] text-yellow-300/90 mt-3 mb-1 font-mono tracking-wide border-t border-gray-800/50 pt-2 line-clamp-2">
                {typeof data.content === "string"
                  ? data.content.substring(0, 100) + (data.content.length > 100 ? "..." : "")
                  : ""}
              </div>
            )}

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
                      <Image
                        src="/sample-image.png"
                        alt="Preview fullscreen"
                        width={1200}
                        height={675}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <button className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500">
                  <Download className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
        </NodeContent>
      )}
    </div>
  )
}

export default memo(ImageNode)

