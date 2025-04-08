"use client"

import { memo, useRef, useEffect } from "react"
import { FileText, Image, Video, Wand2, Layers, X } from "lucide-react"

interface CanvasContextMenuProps {
  position: { x: number; y: number; sourceNodeId?: string }
  onClose: () => void
  onAddNode: (type: string, imageData?: any, nodeData?: any) => void
  sourceNodeId?: string
}

/**
 * CanvasContextMenu Component
 *
 * A context menu that appears when right-clicking on the canvas or dragging a connection to empty space
 */
function CanvasContextMenu({ position, onClose, onAddNode, sourceNodeId }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Handle Escape key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  // Determine if we're showing the menu from a connection drag
  const isFromConnection = !!sourceNodeId

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-black border border-gray-800 rounded-sm shadow-lg p-1.5 min-w-[180px]"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Add Node</div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-0.5">
        {/* Input Nodes Section */}
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-2 mb-1 px-2">Input Nodes</div>

        {/* Text Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("text")}
        >
          <FileText className="h-3.5 w-3.5 text-gray-500" />
          <span>Text</span>
        </button>

        {/* Image Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("image")}
        >
          <Image className="h-3.5 w-3.5 text-gray-500" />
          <span>Image</span>
        </button>

        {/* Output Nodes Section */}
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-3 mb-1 px-2">Output Nodes</div>

        {/* Text to Image Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("text-to-image")}
        >
          <Wand2 className="h-3.5 w-3.5 text-gray-500" />
          <span>Text to Image</span>
        </button>

        {/* Image to Image Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("image-to-image")}
        >
          <Layers className="h-3.5 w-3.5 text-gray-500" />
          <span>Image to Image</span>
        </button>

        {/* Text to Video Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("text-to-video")}
        >
          <Video className="h-3.5 w-3.5 text-gray-500" />
          <span>Text to Video</span>
        </button>

        {/* Image to Video Node */}
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] text-gray-300 hover:bg-gray-800 rounded-sm"
          onClick={() => onAddNode("image-to-video")}
        >
          <Video className="h-3.5 w-3.5 text-gray-500" />
          <span>Image to Video</span>
        </button>
      </div>
    </div>
  )
}

export default memo(CanvasContextMenu)

