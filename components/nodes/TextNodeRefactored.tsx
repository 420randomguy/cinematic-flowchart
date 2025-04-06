"use client"

import { memo, useState, useCallback } from "react"
import { BaseNodeContainer } from "./core/BaseNodeContainer"
import { NodeHeaderSection } from "./sections/NodeHeaderSection"
import { InputSection } from "./sections/InputSection"
import { TextInput } from "@/components/ui/text-input"
import { useNodeState } from "@/hooks/useNodeState"
import { useConnectionStore } from "@/store/useConnectionStore"
import { Zap } from "lucide-react"

function TextNodeRefactored({ data, isConnectable, id }) {
  // Use the node state hook
  const { nodeProps } = useNodeState({ id, data })

  // Local state for text input
  const [promptText, setPromptText] = useState(data.content || "")

  // Get update function from connection store
  const { updateNodeContent } = useConnectionStore()

  // Handle text change
  const handleTextChange = useCallback(
    (text) => {
      setPromptText(text)
      data.content = text
      updateNodeContent(id, text)
    },
    [id, data, updateNodeContent],
  )

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

export default memo(TextNodeRefactored)

