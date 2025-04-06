"use client"

import { memo, type ReactNode } from "react"
import { NodeWrapper } from "@/components/shared/NodeWrapper"
import { Position } from "reactflow"
import { SourceHandle, TargetHandle } from "@/components/shared/NodeHandles"
import { getTargetHandles, getSourceHandle, type NodeCategory } from "@/types/node-model"

interface BaseNodeContainerProps {
  id: string
  data: any
  nodeType: NodeCategory
  children: ReactNode
  className?: string
  isConnectable?: boolean
}

function BaseNodeContainerComponent({
  id,
  data,
  nodeType,
  children,
  className = "",
  isConnectable = true,
}: BaseNodeContainerProps) {
  // Get target handles based on node type from the model
  const targetHandleIds = getTargetHandles(nodeType)

  // Get source handle based on node type from the model
  const sourceHandleId = getSourceHandle(nodeType)

  // Determine if this node has input/output handles
  const hasInputHandles = targetHandleIds.length > 0
  const hasOutputHandle = !!sourceHandleId

  return (
    <NodeWrapper id={id} type={nodeType} isNewNode={data.isNewNode} className={className} dataNodeId={id}>
      {/* Input handles - dynamically generated based on node type */}
      {hasInputHandles &&
        targetHandleIds.map((handleId) => (
          <TargetHandle
            key={handleId}
            position={Position.Left}
            id={handleId}
            isConnectable={isConnectable}
            handleType={handleId}
          />
        ))}

      {/* Output handle - based on node type */}
      {hasOutputHandle && (
        <SourceHandle
          position={Position.Right}
          id={sourceHandleId}
          isConnectable={isConnectable}
          handleType={sourceHandleId}
        />
      )}

      {children}
    </NodeWrapper>
  )
}

export const BaseNodeContainer = memo(BaseNodeContainerComponent)

