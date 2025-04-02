"use client"

import { Undo, Redo, Copy, Clipboard } from "lucide-react"

/**
 * CanvasToolbar Props
 *
 * @property {Function} onUndo - Function to handle undo action
 * @property {Function} onRedo - Function to handle redo action
 * @property {Function} onCopy - Function to handle copy action
 * @property {Function} onPaste - Function to handle paste action
 * @property {boolean} isUndoAvailable - Whether undo is available
 * @property {boolean} isRedoAvailable - Whether redo is available
 * @property {boolean} isCopyAvailable - Whether copy is available
 * @property {boolean} isPasteAvailable - Whether paste is available
 */
interface CanvasToolbarProps {
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onPaste: () => void
  isUndoAvailable: boolean
  isRedoAvailable: boolean
  isCopyAvailable: boolean
  isPasteAvailable: boolean
}

/**
 * CanvasToolbar Component
 *
 * Displays a toolbar with undo, redo, copy, and paste buttons
 */
export default function CanvasToolbar({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  isUndoAvailable,
  isRedoAvailable,
  isCopyAvailable,
  isPasteAvailable,
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-black/90 p-2 rounded-sm flex gap-2 border border-gray-800/50">
      <button
        onClick={onUndo}
        disabled={!isUndoAvailable}
        className={`p-1 rounded-sm ${!isUndoAvailable ? "text-gray-600" : "text-gray-300 hover:bg-gray-800"}`}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!isRedoAvailable}
        className={`p-1 rounded-sm ${!isRedoAvailable ? "text-gray-600" : "text-gray-300 hover:bg-gray-800"}`}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </button>
      <div className="w-px h-4 bg-gray-700 mx-1"></div>
      <button
        onClick={onCopy}
        disabled={!isCopyAvailable}
        className={`p-1 rounded-sm ${!isCopyAvailable ? "text-gray-600" : "text-gray-300 hover:bg-gray-800"}`}
        title="Copy (Ctrl+C)"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        onClick={onPaste}
        disabled={!isPasteAvailable}
        className={`p-1 rounded-sm ${!isPasteAvailable ? "text-gray-600" : "text-gray-300 hover:bg-gray-800"}`}
        title="Paste (Ctrl+V)"
      >
        <Clipboard className="h-4 w-4" />
      </button>
    </div>
  )
}

