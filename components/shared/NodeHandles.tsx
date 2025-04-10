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

  // We need to explicitly set the position in the style
  // ReactFlow is overriding our CSS with inline styles
  const handleStyle: React.CSSProperties = {
    ...style,
    // Force the position to be on the sides with exact pixel values
    ...(position === Position.Left ? { left: "-20px" } : { right: "-20px" }),
    // Force top to be 50%
    top: "50%",
    // Ensure the handle is visible
    opacity: 1,
    visibility: "visible",
    width: "8px",
    height: "8px",
    backgroundColor: "#555",
    borderRadius: "50%",
    border: "2px solid #999",
    transform: "translateY(-50%)",
    zIndex: 100,
  }

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      style={handleStyle}
      className={`node-handle-${position === Position.Left ? "left" : "right"} ${handleClass} ${className}`}
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

