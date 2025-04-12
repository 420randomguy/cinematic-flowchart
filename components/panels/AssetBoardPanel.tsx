"use client"

import { useState, useCallback, useMemo } from "react"
import { ImageIcon, Video, X, Plus } from "lucide-react"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import type { SavedAsset } from "@/store/useImageLibraryStore"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisualMirrorRender } from "@/components/nodes/VisualMirror"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

/**
 * AssetBoardPanel Component
 *
 * A panel that displays saved assets and allows dragging them onto the canvas
 */
export default function AssetBoardPanel() {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images")
  const [selectedAsset, setSelectedAsset] = useState<SavedAsset | null>(null)
  const { showContent } = useVisualMirrorStore()

  // Replace the store access code
  const savedAssets = useImageLibraryStore((state) => state.savedAssets)
  const removeAsset = useImageLibraryStore((state) => state.removeAsset)
  
  // Derive saved images from savedAssets instead of accessing store again
  const savedImages = useMemo(() => 
    savedAssets.filter((asset: SavedAsset) => asset.type === "image").map(asset => asset.url), 
    [savedAssets]
  )

  // Memoize filtered assets to prevent unnecessary filtering on each render
  const filteredAssets = useMemo(() => {
    if (activeTab === "images") {
      return savedAssets.filter((asset: SavedAsset) => asset.type === "image")
    } else if (activeTab === "videos") {
      return savedAssets.filter((asset: SavedAsset) => asset.type === "video")
    }
    return []
  }, [savedAssets, activeTab])

  // Handle image removal
  const handleRemoveImage = useCallback(
    (id: string) => {
      removeAsset(id)
    },
    [removeAsset],
  )

  // Improved drag start handler with better data transfer
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, item: any) => {
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
    e.dataTransfer.effectAllowed = "move"

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

  const handleSelectAsset = useCallback((asset: SavedAsset) => {
    setSelectedAsset(asset);
    
    // Ensure video URLs have a recognizable extension
    let contentUrl = asset.url;
    if (asset.type === 'video' && !contentUrl.match(/\.(mp4|webm|gif)$/i)) {
      // If it's a video but doesn't have a recognized extension, append one
      contentUrl += '.mp4';
    }
    
    // Use the VisualMirrorStore to display content
    showContent('preview_asset', { 
      imageUrl: contentUrl,
      text: asset.description || ''
    });
  }, [showContent]);

  // Render an asset item
  const renderAssetItem = useCallback(
    (asset: any, index: number) => (
      // Replace with standard components
      <div 
        key={asset.id} 
        className="relative group cursor-pointer" 
        draggable 
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, asset)}
        onClick={() => handleSelectAsset(asset)}
      >
        <div className="bg-black node-gradient rounded-xl overflow-hidden border border-gray-800/50 hover:border-gray-600/50 transition-colors">
          {asset.type === "image" ? (
            <img
              src={asset.url || "/placeholder.svg"}
              alt={asset.title || `Asset ${index}`}
              className="w-full h-auto"
              loading="lazy"
            />
          ) : (
            <video
              src={asset.url}
              className="w-full h-auto"
              muted
              loop
              preload="metadata"
            />
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-[10px] text-gray-400 truncate pr-2">
            {asset.title || `${asset.type === "image" ? "Image" : "Video"} ${index + 1}`}
          </div>
          <button
            className="bg-black/70 rounded-full p-0.5 opacity-100 hover:bg-gray-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(asset.id);
            }}
          >
            <X className="h-3 w-3 text-gray-300" />
          </button>
        </div>
      </div>
    ),
    [handleDragStart, handleRemoveImage, handleSelectAsset],
  )

  return (
    <div className="h-full flex flex-col w-[350px] bg-black node-gradient border border-gray-800/50 rounded-xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 30px)' }}>
      {/* Panel header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800/50">
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-wider">Asset Board</h2>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-800/50">
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

      {/* Panel content - make this flex-1 to take remaining height and add overflow-y-auto */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Images/Videos tabs */}
        <>
          {filteredAssets.length > 0 ? (
            <div className="p-3">
              <div className="grid grid-cols-1 gap-3">
                {filteredAssets.map((asset, index) => renderAssetItem(asset, index))}
              </div>
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
      </div>

      {/* Full-screen asset dialog */}
      <Dialog open={selectedAsset !== null} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-[90vw] max-h-[90vh] w-auto h-auto">
          <DialogTitle className="sr-only">
            {selectedAsset?.type === "video" ? "Video Preview" : "Image Preview"}
          </DialogTitle>
          <div className="w-full h-full overflow-hidden">
            {selectedAsset && (
              <VisualMirrorRender 
                nodeId="preview_asset" 
                showCompletionBadge={false}
                showControls={true}
                isFullscreen={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

