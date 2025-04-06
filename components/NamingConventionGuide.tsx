"use client"

import { useState } from "react"
import { X, Info } from "lucide-react"

export default function NamingConventionGuide() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  // Remove or comment out the auto-close effect
  // useEffect(() => {
  //   const hasSeenGuide = localStorage.getItem("hasSeenNamingGuide")
  //   if (!hasSeenGuide) {
  //     setIsOpen(true)
  //     localStorage.setItem("hasSeenNamingGuide", "true")
  //   }
  // }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-md"
        title="Naming Convention Guide"
      >
        <Info className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div
      className={`fixed left-4 ${
        isMinimized ? "bottom-4" : "top-20"
      } z-50 bg-gray-900/95 border border-gray-800 rounded-md shadow-lg transition-all duration-200 w-72`}
    >
      {isMinimized ? (
        <div className="p-2 flex justify-between items-center">
          <span className="text-xs text-gray-300">Naming Convention Guide</span>
          <div className="flex gap-2">
            <button onClick={() => setIsMinimized(false)} className="text-gray-400 hover:text-gray-200" title="Expand">
              <Info className="h-4 w-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-200" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Naming Convention Guide</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-200"
                title="Minimize"
              >
                <span className="text-xs">_</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-200" title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3 max-h-[70vh] overflow-y-auto text-xs">
            <div className="space-y-4">
              {/* Components */}
              <div>
                <h4 className="font-medium text-gray-300 mb-1">Components (PascalCase)</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    <span className="text-gray-300">Canvas</span>: FlowchartCanvas, CanvasBackground
                  </li>
                  <li>
                    <span className="text-gray-300">Nodes</span>: AnalysisNode, ImageNode, VideoNode
                  </li>
                  <li>
                    <span className="text-gray-300">Controls</span>: UndoRedoControls, NodeToolbar
                  </li>
                  <li>
                    <span className="text-gray-300">Modals</span>: ImageCropModal, SettingsModal
                  </li>
                  <li>
                    <span className="text-gray-300">Panels</span>: ImagePreviewPanel, NodeDetailsPanel
                  </li>
                </ul>
              </div>

              {/* Props */}
              <div>
                <h4 className="font-medium text-gray-300 mb-1">Props (camelCase)</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    <span className="text-gray-300">Node Props</span>: nodeData, nodeId, nodeType
                  </li>
                  <li>
                    <span className="text-gray-300">Event Props</span>: onNodeSelect, onNodeDelete
                  </li>
                  <li>
                    <span className="text-gray-300">State Props</span>: isSelected, isEditing, isSubmitting
                  </li>
                  <li>
                    <span className="text-gray-300">UI Props</span>: showControls, showImage, showCaption
                  </li>
                </ul>
              </div>

              {/* State */}
              <div>
                <h4 className="font-medium text-gray-300 mb-1">State (camelCase)</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    <span className="text-gray-300">Canvas State</span>: nodes, edges, selectedNodeId
                  </li>
                  <li>
                    <span className="text-gray-300">UI State</span>: isSubmitting, showVideo, contextMenu
                  </li>
                  <li>
                    <span className="text-gray-300">History State</span>: undoStack, redoStack, isUndoRedoing
                  </li>
                  <li>
                    <span className="text-gray-300">Node State</span>: quality, timeRemaining, selectedModel
                  </li>
                </ul>
              </div>

              {/* Event Handlers */}
              <div>
                <h4 className="font-medium text-gray-300 mb-1">Event Handlers (camelCase)</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    <span className="text-gray-300">Node Events</span>: handleNodeClick, handleNodeDrag
                  </li>
                  <li>
                    <span className="text-gray-300">Canvas Events</span>: handlePaneClick, handleContextMenu
                  </li>
                  <li>
                    <span className="text-gray-300">History Events</span>: handleUndo, handleRedo
                  </li>
                  <li>
                    <span className="text-gray-300">Clipboard Events</span>: handleCopy, handlePaste
                  </li>
                </ul>
              </div>

              {/* Folder Structure */}
              <div>
                <h4 className="font-medium text-gray-300 mb-1">Folder Structure</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>
                    <span className="text-gray-300">/components/canvas/</span>: Canvas-related components
                  </li>
                  <li>
                    <span className="text-gray-300">/components/nodes/</span>: Node type components
                  </li>
                  <li>
                    <span className="text-gray-300">/components/controls/</span>: UI controls and toolbars
                  </li>
                  <li>
                    <span className="text-gray-300">/components/panels/</span>: Side panels and previews
                  </li>
                  <li>
                    <span className="text-gray-300">/components/modals/</span>: Modal dialogs
                  </li>
                  <li>
                    <span className="text-gray-300">/hooks/</span>: Custom React hooks
                  </li>
                  <li>
                    <span className="text-gray-300">/lib/</span>: Utility functions and helpers
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

