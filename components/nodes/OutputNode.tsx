"use client"

import { memo, useState } from "react"
import type { NodeProps } from "reactflow"
import { BaseNode } from "@/components/nodes/BaseNode"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { SubmitButton } from "@/components/ui/submit-button"

interface OutputNodeData {
  title?: string
}

function OutputNode({ data, isConnectable, id }: NodeProps<OutputNodeData>) {
  const setIsInteractingWithInput = useFlowchartStore((state) => state.setIsInteractingWithInput)
  
  // Render the Output node with a submit button
  return (
    <div className="output-node" onMouseDown={() => setIsInteractingWithInput(false)}>
      <BaseNode
        id={id}
        data={{
          ...data,
          skipNodeContent: false, // We want the BaseNode to render content
        }}
        nodeType="output"
        title={data.title || "OUTPUT"}
        showSourceHandle={true}
        showTargetHandle={true}
        targetHandleIds={["text", "image"]}
        isConnectable={isConnectable}
        contentProps={{
          handleSubmitToggle: true // This will trigger the SubmitButton to be rendered
        }}
      >
        <div className="p-2 mt-2 border-t border-gray-800/50">
          <div className="text-[10px] text-gray-500 text-center">
            Connect to a Render node to see results
          </div>
        </div>
      </BaseNode>
    </div>
  )
}

export default memo(OutputNode) 