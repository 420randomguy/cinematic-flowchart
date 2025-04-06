"use client"

import { memo, type ReactNode } from "react"
import { NodeWrapper } from "@/components/shared/NodeWrapper"
import { Position } from "reactflow"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"

interface BaseNodeContainerProps {
  id: string
  data: any
  nodeType: string
  children: ReactNode
  className?: string
  isConnectable?: boolean
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  targetHandleIds?: string[]
  sourceHandleId?: string
}

function BaseNodeContainerComponent({
  id,
  data,
  nodeType,
  children,
  className = "",
  isConnectable = true,
  showSourceHandle = false,
  showTargetHandle = false,
  targetHandleIds = ["text"],
  sourceHandleId,
}: BaseNodeContainerProps) {
  // Determine handle types for color coding
  const getHandleType = (handleId: string) => {
    if (handleId === "text") return "text"
    if (handleId === "image") return "image"
    if (handleId === "lora") return "lora"
    return undefined
  }

  return (
    <NodeWrapper id={id} type={nodeType} isNewNode={data.isNewNode} className={className} dataNodeId={id}>
      {/* Input handles */}
      {showTargetHandle &&
        targetHandleIds.map((handleId) => (
          <TargetHandle
            key={handleId}
            position={Position.Left}
            id={handleId}
            isConnectable={isConnectable}
            handleType={getHandleType(handleId)}
          />
        ))}

      {/* Output handle */}
      {showSourceHandle && (
        <SourceHandle
          position={Position.Right}
          id={sourceHandleId}
          isConnectable={isConnectable}
          handleType={sourceHandleId ? getHandleType(sourceHandleId) : undefined}
        />
      )}

      {children}
    </NodeWrapper>
  )
}

export const BaseNodeContainer = memo(BaseNodeContainerComponent)

