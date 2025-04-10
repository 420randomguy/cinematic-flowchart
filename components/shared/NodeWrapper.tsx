"use client"

import type React from "react"

import { memo, forwardRef } from "react"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface NodeWrapperProps {
  id: string
  type: string
  isNewNode?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
  children: React.ReactNode
  dataNodeId?: string
}

const NodeWrapperComponent = forwardRef<HTMLDivElement, NodeWrapperProps>(
  ({ id, type, isNewNode, className = "", onClick, children, dataNodeId }, ref) => {
    // Get the selected node ID from the store
    const selectedNodeId = useFlowchartStore((state) => state.selectedNodeId)

    // Determine if this node is selected
    const isSelected = selectedNodeId === id || selectedNodeId === dataNodeId

    return (
      <div
        ref={ref}
        className={`bg-black border relative node-gradient ${
          isSelected 
            ? "border-gray-600/50 node-selected" 
            : "border-gray-800/50"
        } rounded-xl p-2.5 text-[10px] flex flex-col gap-1.5 w-[260px] font-mono relative shadow-sm ${
          isNewNode ? "animate-in fade-in slide-in-from-left-10 duration-300" : ""
        } ${className} react-flow__node-target-area`}
        data-node-id={dataNodeId || id}
        data-node-type={type}
        onClick={onClick}
      >
        {children}
      </div>
    )
  },
)

NodeWrapperComponent.displayName = "NodeWrapper"

// Memoize the component with a custom comparison function
export const NodeWrapper = memo(NodeWrapperComponent, (prevProps, nextProps) => {
  // Compare props that affect rendering
  if (prevProps.id !== nextProps.id) return false
  if (prevProps.type !== nextProps.type) return false
  if (prevProps.isNewNode !== nextProps.isNewNode) return false
  if (prevProps.className !== nextProps.className) return false
  if (prevProps.dataNodeId !== nextProps.dataNodeId) return false

  // Compare onClick handler (shallow comparison)
  if (prevProps.onClick !== nextProps.onClick) return false

  // ref comparison is not needed

  return true
})

