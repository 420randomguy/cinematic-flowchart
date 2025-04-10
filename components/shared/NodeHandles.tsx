"use client"

import type React from "react"
import { Handle, Position } from "reactflow"

interface NodeHandleProps {
  type: "source" | "target"
  position: Position
  id?: string
  isConnectable?: boolean
  style?: React.CSSProperties
  className?: string
  handleType?: "text" | "image" | "lora" | "video"
}

export function NodeHandle({
  type,
  position,
  id,
  isConnectable = true,
  style = {},
  className = "",
  handleType,
}: NodeHandleProps) {
  // Add class based on handle type
  const handleClass = handleType ? `handle-${handleType}` : ""
  const positionClass = position === Position.Left ? "node-handle-left" : "node-handle-right"

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      className={`node-handle ${positionClass} ${handleClass} ${className}`}
      data-handletype={handleType}
      data-handleid={id}
    />
  )
}

export function SourceHandle(props: Omit<NodeHandleProps, "type">) {
  return <NodeHandle type="source" {...props} />
}

export function TargetHandle(props: Omit<NodeHandleProps, "type">) {
  return <NodeHandle type="target" {...props} />
}

export function HiddenHandle(props: Omit<NodeHandleProps, "className" | "style">) {
  return (
    <Handle
      type={props.type}
      position={props.position}
      id={props.id}
      isConnectable={props.isConnectable}
      className="opacity-0 pointer-events-none"
      data-handletype={props.handleType}
      data-handleid={props.id}
    />
  )
}

