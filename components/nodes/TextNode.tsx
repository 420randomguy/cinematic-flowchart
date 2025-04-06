"use client"

import { memo, useState, useCallback, useEffect } from "react"
import { BaseNodeContainer } from "@/components/core/BaseNodeContainer"
import { NodeHeaderSection } from "@/components/sections/NodeHeaderSection"
import { InputSection } from "@/components/sections/InputSection"
import { TextInput } from "@/components/ui/TextInput"
import { useNodeState } from "@/hooks/useNodeState"
import { useConnectionStore } from "@/store/useConnectionStore"
import { Zap } from "lucide-react"
import type { NodeProps } from "reactflow"
import type { TextNodeData } from "@/types/node-types"
import { useReactFlow } from "reactflow"

function TextNode({ data, isConnectable, id }: NodeProps<TextNodeData>) {
  // Use the node state hook
  const { nodeProps } = useNodeState({ id, data })

  // Local state for text input
  const [promptText, setPromptText] = useState(data.content || "")

  // Get update function from connection store
  const { updateNodeContent } = useConnectionStore()
  const { getEdges, setNodes } = useReactFlow()

  // Ensure the TextNode properly updates connected nodes when text changes

  // Handle text change with immediate propagation to connected nodes
  const handleTextChange = useCallback(
    (text: string) => {
      setPromptText(text)

      // Update this node's content
      data.content = text

      // Update the connection store
      const { updateNodeContent } = useConnectionStore.getState()
      updateNodeContent(id, text)

      // Also update directly through ReactFlow for immediate effect
      setNodes((nodes) =>
        nodes.map((node) => {
          // Find nodes that have this node as a source
          const isTarget = getEdges().some((edge) => edge.source === id && edge.target === node.id)
          if (isTarget) {
            return {
              ...node,
              data: {
                ...node.data,
                sourceNodeContent: text,
                _lastUpdated: Date.now(),
              },
            }
          }
          return node
        }),
      )
    },
    [id, data, getEdges, setNodes],
  )

  // Initialize content if needed
  useEffect(() => {
    // Initialize content if needed
    if (!data.content && promptText) {
      data.content = promptText
    }
  }, [promptText])

  // Add this useEffect to ensure initial content propagation
  useEffect(() => {
    // If there's content but no propagation has happened yet, trigger an update
    if (data.content && !data._hasInitializedConnections) {
      // Mark as initialized to prevent multiple propagations
      data._hasInitializedConnections = true

      // Propagate content to any connected nodes
      updateNodeContent(id, data.content)

      // Also update directly through ReactFlow for immediate effect
      setNodes((nodes) =>
        nodes.map((node) => {
          // Find nodes that have this node as a source
          const isTarget = getEdges().some((edge) => edge.source === id && edge.target === node.id)
          if (isTarget) {
            return {
              ...node,
              data: {
                ...node.data,
                sourceNodeContent: data.content,
                _lastUpdated: Date.now(),
              },
            }
          }
          return node
        }),
      )
    }
  }, [id, data, updateNodeContent, getEdges, setNodes])

  // The issue might be that the TextNode isn't properly registering its content
  // Let's ensure it updates the connection store when its content changes

  // Add or update the useEffect that registers the content
  useEffect(() => {
    if (data.content) {
      // Register the content with the connection store
      updateNodeContent(id, data.content)
      console.log(`TextNode ${id} registered content:`, data.content)
    }
  }, [id, data.content, updateNodeContent])

  return (
    <BaseNodeContainer
      id={id}
      data={data}
      nodeType="text"
      showSourceHandle={true}
      sourceHandleId="text"
      isConnectable={isConnectable}
    >
      <NodeHeaderSection title={data.title || "PROMPT TITLE"} type="text" />

      <div className="flex items-center gap-1 text-[8px] text-gray-500 mb-2">
        <Zap className="h-2.5 w-2.5 text-yellow-600/70" />
        <span className="tracking-wide">xai-org driven</span>
      </div>

      <InputSection>
        <TextInput value={promptText} onChange={handleTextChange} maxChars={4000} />
      </InputSection>
    </BaseNodeContainer>
  )
}

export default memo(TextNode)

