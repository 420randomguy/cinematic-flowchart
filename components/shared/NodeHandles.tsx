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
}

export function NodeHandle({ type, position, id, isConnectable = true, style = {}, className = "" }: NodeHandleProps) {
  const baseStyle = {
    [position === Position.Left ? "left" : "right"]: -15,
    width: 8,
    height: 8,
    background: type === "source" ? "#777" : "#555",
    border: "2px solid #999",
    borderRadius: "50%",
    cursor: "pointer",
    ...style,
  }

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      style={baseStyle}
      className={`node-handle-${position === Position.Left ? "left" : "right"} ${className}`}
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
    />
  )
}

