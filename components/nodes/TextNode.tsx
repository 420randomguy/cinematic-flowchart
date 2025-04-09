"use client"

import { memo, useState, useCallback, useEffect, useMemo } from "react"
import { BaseNodeContainer } from "@/components/core/BaseNodeContainer"
import { NodeHeaderSection } from "@/components/nodes/sections/NodeHeaderSection"
import { InputSection } from "@/components/nodes/sections/InputSection"
import { TextInput } from "@/components/ui/TextInput"
import { useNodeState } from "@/hooks/useNodeState"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { Zap } from "lucide-react"
import type { NodeProps } from "reactflow"
import { useReactFlow } from 'reactflow'
import type { TextNodeData } from "@/types/node-types"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// Create stable selector for the store's updateNodeContent function
const updateNodeContentSelector = (state: any) => state.updateNodeContent

function TextNode({ data, isConnectable, id }: NodeProps<TextNodeData>) {
  // Use the node state hook
  const { nodeProps } = useNodeState({ id, data })
  
  // Get the centralized update function from the store
  const updateNodeContent = useFlowchartStore(updateNodeContentSelector)
  
  // Get getEdges function from React Flow
  const { getEdges } = useReactFlow()

  // Get the showContent function from the visual mirror store
  const { showContent } = useVisualMirrorStore()

  // Local state for text input
  const [promptText, setPromptText] = useState(data.content || "")

  // Handle text change - update local state and use the centralized store for propagation
  const handleTextChange = useCallback(
    (text: string) => {
      // Update local state first
      setPromptText(text)

      // Update centralized store (which handles persistent data propagation)
      updateNodeContent(id, text)

      // Also update the visual mirror store for this node
      showContent(id, { text })
      
      // Find connected target nodes and update their visual content
      const currentEdges = getEdges()
      const targetNodeIds = currentEdges
        .filter(edge => edge.source === id)
        .map(edge => edge.target)
        
      // Update visual mirror for each connected target node
      targetNodeIds.forEach(targetId => {
        showContent(targetId, { text })
      })
    },
    [id, updateNodeContent, getEdges, showContent],
  )

  // Initialize local state when component mounts or data changes
  useEffect(() => {
    if (data.content && data.content !== promptText) {
      setPromptText(data.content)
    }
  }, [data.content, promptText])

  return (
    <BaseNodeContainer
      id={id}
      data={data}
      nodeType="text"
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

