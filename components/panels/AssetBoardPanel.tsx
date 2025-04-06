"use client"

import { useState, useCallback, useMemo } from "react"
import { FileText, ImageIcon, Video, Wand2, Layers, Plus, X } from "lucide-react"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Share } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
// Remove imports for VirtualizedList and LazyLoad
// Remove:
// import { VirtualizedList } from "@/components/ui/VirtualizedList"
// import { LazyLoad } from "@/components/ui/LazyLoad"
import { createLazyComponent } from "@/lib/utils/code-splitting"

// Lazy load the image viewer component
const ImageViewer = createLazyComponent(() => import("@/components/ui/ImageViewer"))

/**
 * AssetBoardPanel Component
 *
 * A panel that displays saved assets and allows dragging them onto the canvas
 */
export default function AssetBoardPanel() {
  const [activeTab, setActiveTab] = useState<"nodes" | "images" | "videos">("nodes")
  const [selectedImage, setSelectedImage] = useState<{
    src: string
    alt: string
    title: string
  } | null>(null)

  const savedAssets = useImageLibraryStore((state) => state.savedAssets)
  const removeAsset = useImageLibraryStore((state) => state.removeAsset)
  const savedImages = useImageLibraryStore((state) => state.getSavedImages())

  // Memoize filtered assets to prevent unnecessary filtering on each render
  const filteredAssets = useMemo(() => {
    if (activeTab === "images") {
      return savedAssets.filter((asset) => asset.type === "image")
    } else if (activeTab === "videos") {
      return savedAssets.filter((asset) => asset.type === "video")
    }
    return []
  }, [savedAssets, activeTab])

  // Handle drag start for nodes
  const handleNodeDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: nodeType,
        data: {
          title:
            nodeType === "text"
              ? "TEXT TITLE"
              : nodeType === "text-to-image"
                ? "TEXT-TO-IMAGE TITLE"
                : nodeType === "image-to-image"
                  ? "IMAGE-TO-IMAGE TITLE"
                  : nodeType === "image"
                    ? "IMAGE TITLE"
                    : "VIDEO TITLE",
          showImage: nodeType !== "text",
          category: nodeType === "text" ? "text" : nodeType,
          seed: Math.floor(Math.random() * 1000000000).toString(),
          content: "",
          isNewNode: true,
        },
      }),
    )
    event.dataTransfer.effectAllowed = "move"
  }, [])

  // Handle drag start for images
  const handleImageDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, imageUrl: string) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: "image",
        data: {
          title: "LIBRARY IMAGE",
          showImage: true,
          category: "image",
          seed: Math.floor(Math.random() * 1000000000).toString(),
          content: "",
          imageUrl: imageUrl,
          isNewNode: true,
        },
      }),
    )
    event.dataTransfer.effectAllowed = "move"
  }, [])

  // Handle image removal
  const handleRemoveImage = useCallback(
    (id: string) => {
      removeAsset(id)
    },
    [removeAsset],
  )

  // Improved drag start handler with better data transfer
  const handleDragStart = useCallback((e: React.DragEvent, item: any) => {
    // Set the drag data with complete node information
    e.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: item.type === "video" ? "video" : "image",
        data: {
          title: item.title,
          showImage: true,
          category: item.type,
          imageUrl: item.url,
          seed: item.settings?.seed || Math.floor(Math.random() * 1000000000).toString(),
          content: item.description || "",
          caption: item.caption || null,
          isNewNode: true,
          modelId: item.settings?.modelId,
          modelSettings: item.settings?.modelSettings,
        },
      }),
    )
    event.dataTransfer.effectAllowed = "move"

    // Create a drag preview
    const dragPreview = document.createElement("div")
    dragPreview.className = "bg-black border border-gray-800 rounded-sm p-2 text-xs text-white"
    dragPreview.textContent = item.title
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, 0, 0)

    // Remove the drag preview element after a short delay
    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)
  }, [])

  // Render a node item
  const renderNodeItem = useCallback(
    (nodeType: string, label: string, icon: React.ReactNode) => (
      <div
        className="bg-black border border-gray-800 rounded-sm p-2 flex items-center gap-2 cursor-grab"
        draggable
        onDragStart={(e) => handleNodeDragStart(e, nodeType)}
      >
        {icon}
        <span className="text-[10px] text-gray-300">{label}</span>
      </div>
    ),
    [handleNodeDragStart],
  )

  // Render an asset item
  const renderAssetItem = useCallback(
    (asset: any, index: number) => (
      // Replace with standard components
      <div key={asset.id} className="relative group" draggable onDragStart={(e) => handleDragStart(e, asset)}>
        <div className="aspect-square bg-gray-900 rounded-sm overflow-hidden border border-gray-800">
          <img
            src={asset.url || "/placeholder.svg"}
            alt={asset.title || `Asset ${index}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <button
          className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleRemoveImage(asset.id)}
        >
          <X className="h-3 w-3 text-gray-300" />
        </button>
      </div>
    ),
    [handleDragStart, handleRemoveImage],
  )

  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800/50">
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-wider">Asset Board</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300">
          <Share className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-800/50">
        <button
          className={`flex-1 py-2 text-[10px] uppercase tracking-wider ${
            activeTab === "nodes" ? "text-yellow-500 border-b border-yellow-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("nodes")}
        >
          Nodes
        </button>
        <button
          className={`flex-1 py-2 text-[10px] uppercase tracking-wider ${
            activeTab === "images" ? "text-yellow-500 border-b border-yellow-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("images")}
        >
          Images
        </button>
        <button
          className={`flex-1 py-2 text-[10px] uppercase tracking-wider ${
            activeTab === "videos" ? "text-yellow-500 border-b border-yellow-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {/* Nodes tab */}
        {activeTab === "nodes" && (
          <div className="p-3 space-y-2">
            {renderNodeItem("text", "Text", <FileText className="h-4 w-4 text-gray-500" />)}
            {renderNodeItem("text-to-image", "Text to Image", <Wand2 className="h-4 w-4 text-gray-500" />)}
            {renderNodeItem("image-to-image", "Image to Image", <Layers className="h-4 w-4 text-gray-500" />)}
            {renderNodeItem("image", "Image", <ImageIcon className="h-4 w-4 text-gray-500" />)}
            {renderNodeItem("text-to-video", "Text to Video", <Video className="h-4 w-4 text-gray-500" />)}
            {renderNodeItem("image-to-video", "Image to Video", <Video className="h-4 w-4 text-gray-500" />)}
          </div>
        )}

        {/* Images/Videos tabs with virtualization */}
        {(activeTab === "images" || activeTab === "videos") && (
          <>
            {filteredAssets.length > 0 ? (
              <div className="p-3 max-h-[400px] overflow-auto">
                {filteredAssets.map((asset, index) => renderAssetItem(asset, index))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center p-3">
                {activeTab === "images" ? (
                  <>
                    <ImageIcon className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="text-[10px] text-gray-500">No saved images yet</p>
                  </>
                ) : (
                  <>
                    <Video className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="text-[10px] text-gray-500">No saved videos yet</p>
                  </>
                )}
                <p className="text-[9px] text-gray-600 mt-1">
                  {activeTab === "images" ? "Images" : "Videos"} will appear here when you generate them
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add asset button */}
      <div className="p-3 border-t border-gray-800/50">
        <button className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-sm text-[10px] text-gray-300 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Full-screen image dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black border border-gray-800">
          {selectedImage && (
            <ImageViewer
              src={selectedImage.src || "/placeholder.svg"}
              alt={selectedImage.alt}
              title={selectedImage.title}
              onClose={() => setSelectedImage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

