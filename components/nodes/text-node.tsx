"use client"

import { memo, useState, useCallback } from "react"
import { Position, type NodeProps } from "reactflow"
import { Zap } from "lucide-react"
import type { TextNodeData } from "@/types"
import { TextInput } from "@/components/ui/TextInput"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { SourceHandle } from "@/components/shared/NodeHandles"

function TextNode({ data, isConnectable, id }: NodeProps<TextNodeData>) {
  const [promptText, setPromptText] = useState(data.content || "")

  // Use the consolidated hook for node connections
  const { updateNodeContent } = useNodeConnections({ id })

  // Handle text change with immediate propagation to connected nodes
  const handleTextChange = useCallback(
    (text: string) => {
      setPromptText(text)

      // Update this node's content
      data.content = text

      // Use the consolidated hook to update connected nodes
      updateNodeContent(id, text)
    },
    [id, data, updateNodeContent],
  )

  return (
    <div className="bg-black border border-gray-800/50 rounded-sm p-2.5 text-[10px] flex flex-col gap-1.5 max-w-[260px] font-mono relative shadow-sm">
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        TEXT
      </div>

      {/* Use our improved SourceHandle component */}
      <SourceHandle position={Position.Right} id="text" isConnectable={isConnectable} handleType="text" />

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">
        {data.title || "PROMPT TITLE"}
      </div>

      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-500">
          <Zap className="h-2.5 w-2.5 text-yellow-600/70" />
          <span className="tracking-wide">xai-org driven</span>
        </div>
      </div>

      <TextInput value={promptText} onChange={handleTextChange} maxChars={4000} />
    </div>
  )
}

export default memo(TextNode)

