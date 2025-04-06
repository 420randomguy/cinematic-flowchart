"use client"

import type React from "react"

import { memo, useState, useRef, useCallback, useEffect } from "react"
import type { NodeProps } from "reactflow"
import { Link } from "lucide-react"
import type { TextNodeData } from "@/types"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { createInputProps, createNodeEventHandler } from "@/lib/utils/node-interaction"
import { useMemoizedNodeProps } from "@/hooks/useMemoizedNodeProps"
import { useNodeConnections } from "@/hooks/useNodeConnections"
import { BaseNode } from "@/components/nodes/BaseNode"

function URLNode({ data, isConnectable, id }: NodeProps<TextNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting)
    },
    [setIsInteractingWithInput],
  )
  const [urlText, setUrlText] = useState(data.content || "")
  const MAX_CHARS = 500
  const inputRef = useRef<HTMLInputElement>(null)

  const { nodeProps } = useMemoizedNodeProps(id, data)
  const { updateNodeContent } = useNodeConnections({ id })

  // Create input props for event handling
  const inputProps = createInputProps(handleInputInteraction)

  // Update the node data when text changes
  useEffect(() => {
    if (data.content !== urlText) {
      data.content = urlText
    }
  }, [urlText, data])

  // Handle text change with immediate propagation to connected nodes
  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value
      if (text.length <= MAX_CHARS) {
        setUrlText(text)

        // Update this node's content
        data.content = text

        // Use the consolidated hook to update connected nodes
        updateNodeContent(text)
      }
    },
    [data, updateNodeContent, MAX_CHARS],
  )

  // Handle button click to open URL
  const handleOpenUrl = createNodeEventHandler(() => {
    if (urlText && (urlText.startsWith("http://") || urlText.startsWith("https://"))) {
      window.open(urlText, "_blank", "noopener,noreferrer")
    } else if (urlText) {
      window.open(`https://${urlText}`, "_blank", "noopener,noreferrer")
    }
  })

  return (
    <BaseNode
      id={id}
      data={data}
      nodeType="url"
      title={nodeProps.title || "URL INPUT"}
      showSourceHandle={true}
      showTargetHandle={false}
      isConnectable={isConnectable}
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1 text-[8px] text-gray-500">
          <Link className="h-2.5 w-2.5 text-yellow-600/70" />
          <span className="tracking-wide">url input</span>
        </div>
      </div>

      <div className="border-t border-b border-gray-800/50 py-1.5 my-0.5 relative">
        <div className="relative flex">
          <input
            ref={inputRef}
            value={urlText}
            onChange={handleUrlChange}
            className="w-full h-8 bg-black text-[9px] text-gray-300 p-1.5 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 overflow-hidden prevent-node-drag"
            placeholder="Enter URL here..."
            {...inputProps}
          />
          <button
            className="absolute right-1 top-1 text-gray-400 hover:text-gray-300 bg-gray-800/50 px-1 py-0.5 rounded"
            title="Open URL"
            onClick={handleOpenUrl}
          >
            <Link className="h-3 w-3" />
          </button>
        </div>
        <div className="absolute bottom-1 right-1 text-[8px] text-gray-500">
          {urlText.length}/{MAX_CHARS}
        </div>
      </div>
    </BaseNode>
  )
}

export default memo(URLNode)

