"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * ElementReferencePanel Component
 *
 * Displays a comprehensive list of all available elements and node types in the application
 */
export default function ElementReferencePanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    inputNodes: true,
    outputNodes: false,
    handles: false,
    actions: false,
    utilities: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-4 z-50 bg-black hover:bg-gray-800 text-white p-2 rounded-md shadow-md border border-gray-800"
        title="Element Reference"
      >
        <Info className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="fixed left-4 top-20 z-50 bg-black/95 border border-gray-800 rounded-md shadow-lg transition-all duration-200 w-80 max-h-[80vh] overflow-auto">
      <div className="p-3 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-black z-10">
        <h3 className="text-sm font-medium text-white">Element Reference</h3>
        <div className="flex gap-2">
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-200" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-3 text-xs">
        {/* Input Node Types Section */}
        <div className="mb-4">
          <button
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white mb-2"
            onClick={() => toggleSection("inputNodes")}
          >
            <span className="font-medium">Input Nodes</span>
            {expandedSections.inputNodes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.inputNodes && (
            <div className="pl-2 space-y-2 border-l border-gray-800">
              <div className="space-y-1">
                <div className="text-gray-300 font-medium">text</div>
                <div className="text-gray-500 text-[10px]">Text prompt node for generating content</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">image</div>
                <div className="text-gray-500 text-[10px]">Basic image display and management</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">url</div>
                <div className="text-gray-500 text-[10px]">Input node for providing a URL</div>
              </div>
            </div>
          )}
        </div>

        {/* Output Node Types Section */}
        <div className="mb-4">
          <button
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white mb-2"
            onClick={() => toggleSection("outputNodes")}
          >
            <span className="font-medium">Output Nodes</span>
            {expandedSections.outputNodes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.outputNodes && (
            <div className="pl-2 space-y-2 border-l border-gray-800">
              <div className="space-y-1">
                <div className="text-gray-300 font-medium">text-to-image</div>
                <div className="text-gray-500 text-[10px]">Generates images from text prompts</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">image-to-video</div>
                <div className="text-gray-500 text-[10px]">Converts images to videos with motion</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">text-to-video</div>
                <div className="text-gray-500 text-[10px]">Generates videos directly from text prompts</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">image-to-image</div>
                <div className="text-gray-500 text-[10px]">Transforms images based on settings</div>
              </div>
            </div>
          )}
        </div>

        {/* Handles Section */}
        <div className="mb-4">
          <button
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white mb-2"
            onClick={() => toggleSection("handles")}
          >
            <span className="font-medium">Connection Handles</span>
            {expandedSections.handles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.handles && (
            <div className="pl-2 space-y-2 border-l border-gray-800">
              <div className="space-y-1">
                <div className="text-gray-300 font-medium">SourceHandle</div>
                <div className="text-gray-500 text-[10px]">Output connection point (right side)</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">TargetHandle</div>
                <div className="text-gray-500 text-[10px]">Input connection point (left side)</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">HiddenHandle</div>
                <div className="text-gray-500 text-[10px]">Invisible connection point for specific connections</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">video-text-input</div>
                <div className="text-gray-500 text-[10px]">Special handle ID for text input to video nodes</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">video-image-input</div>
                <div className="text-gray-500 text-[10px]">Special handle ID for image input to video nodes</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">text</div>
                <div className="text-gray-500 text-[10px]">Handle ID for text input (e.g., to image/video nodes)</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">lora</div>
                <div className="text-gray-500 text-[10px]">Handle ID for LoRA input (e.g., to image nodes)</div>
              </div>

              {/* Note: Image-to-Image nodes also accept image input, 
                   but its specific handle ID is not explicitly defined 
                   in the component file and needs further investigation 
                   (expected: 'image-image-input'). 
              */}
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="mb-4">
          <button
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white mb-2"
            onClick={() => toggleSection("actions")}
          >
            <span className="font-medium">Node Actions</span>
            {expandedSections.actions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.actions && (
            <div className="pl-2 space-y-2 border-l border-gray-800">
              <div className="space-y-1">
                <div className="text-gray-300 font-medium">SubmitButton</div>
                <div className="text-gray-500 text-[10px]">Triggers generation in nodes</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">NodeActions</div>
                <div className="text-gray-500 text-[10px]">Fullscreen and download buttons</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">NodeSettings</div>
                <div className="text-gray-500 text-[10px]">Quality, seed, and model settings</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">NodeHeader</div>
                <div className="text-gray-500 text-[10px]">Title and type label for nodes</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">VisualMirror</div>
                <div className="text-gray-500 text-[10px]">Content display for text and images</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">TextPreview</div>
                <div className="text-gray-500 text-[10px]">Displays connected text content preview</div>
              </div>
            </div>
          )}
        </div>

        {/* Utilities Section */}
        <div className="mb-4">
          <button
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white mb-2"
            onClick={() => toggleSection("utilities")}
          >
            <span className="font-medium">Utility Components</span>
            {expandedSections.utilities ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {expandedSections.utilities && (
            <div className="pl-2 space-y-2 border-l border-gray-800">
              <div className="space-y-1">
                <div className="text-gray-300 font-medium">CanvasContextMenu</div>
                <div className="text-gray-500 text-[10px]">Right-click menu for adding nodes</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">CanvasToolbar</div>
                <div className="text-gray-500 text-[10px]">Undo, redo, copy, paste buttons</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">ImageSelectorDialog</div>
                <div className="text-gray-500 text-[10px]">Dialog for selecting images from library</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">ImageCropModal</div>
                <div className="text-gray-500 text-[10px]">Modal for cropping uploaded images</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">AssetBoardPanel</div>
                <div className="text-gray-500 text-[10px]">Side panel for managing saved assets</div>
              </div>

              <div className="space-y-1">
                <div className="text-gray-300 font-medium">ModelSelector</div>
                <div className="text-gray-500 text-[10px]">Component for selecting AI models</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

