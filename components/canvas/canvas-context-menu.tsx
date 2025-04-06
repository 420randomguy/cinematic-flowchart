"use client"

import { FileText, ImageIcon, Video } from "lucide-react"

/**
 * CanvasContextMenu Props
 *
 * @property {Object} position - The position of the context menu
 * @property {number} position.x - The x coordinate
 * @property {number} position.y - The y coordinate
 * @property {string} [position.sourceNodeId] - Optional source node ID for connections
 * @property {Function} onClose - Function to close the context menu
 * @property {Function} onAddNode - Function to add a new node
 * @property {string} [sourceNodeId] - Optional source node ID for connections
 */
interface CanvasContextMenuProps {
  position: { x: number; y: number; sourceNodeId?: string }
  onClose: () => void
  onAddNode: (type: "analysis" | "image" | "video") => void
  sourceNodeId?: string
}

/**
 * CanvasContextMenu Component
 *
 * Displays a context menu for adding nodes to the canvas
 */
export default function CanvasContextMenu({ position, onClose, onAddNode, sourceNodeId }: CanvasContextMenuProps) {
  return (
    <div
      className="fixed z-50 bg-black border border-gray-800 rounded-sm shadow-lg py-1 w-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="px-2 py-1 text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-800">
        {sourceNodeId ? "Connect To" : "Add New Card"}
      </div>

      {/* Only show Prompt option if not connecting from a source */}
      {!sourceNodeId && (
        <button
          className="w-full px-3 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          onClick={() => onAddNode("analysis")}
        >
          <FileText className="h-3 w-3 text-gray-400" />
          <span>Prompt</span>
        </button>
      )}

      {/* Always show Image and Video options */}
      <button
        className="w-full px-3 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 flex items-center gap-2"
        onClick={() => onAddNode("image")}
      >
        <ImageIcon className="h-3 w-3 text-gray-400" />
        <span>Image</span>
      </button>
      <button
        className="w-full px-3 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 flex items-center gap-2"
        onClick={() => onAddNode("video")}
      >
        <Video className="h-3 w-3 text-gray-400" />
        <span>Video</span>
      </button>
    </div>
  )
}

