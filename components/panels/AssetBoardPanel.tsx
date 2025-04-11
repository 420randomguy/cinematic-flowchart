"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { ImageIcon, Video, X, Share, Maximize2, Download } from "lucide-react"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

import type React from "react"
import { Button } from "@/components/ui/button"

/**
 * AssetBoardPanel Component
 *
 * A simplified panel that displays saved assets
 */
export default function AssetBoardPanel() {
  const [activeTab, setActiveTab] = useState<"images" | "videos">("images")
  const { showContent } = useVisualMirrorStore()
  const [playingAsset, setPlayingAsset] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<any | null>(null)
  const previousTabRef = useRef(activeTab)

  const savedAssets = useImageLibraryStore((state) => state.savedAssets)
  const removeAsset = useImageLibraryStore((state) => state.removeAsset)
  
  // Memoize filtered assets to prevent unnecessary filtering on each render
  const filteredAssets = useMemo(() => {
    if (activeTab === "images") {
      return savedAssets.filter((asset) => asset.type === "image")
    } else if (activeTab === "videos") {
      return savedAssets.filter((asset) => asset.type === "video")
    }
    return []
  }, [savedAssets, activeTab])

  // Register assets with VisualMirror when the list changes
  useEffect(() => {
    // Only register visible assets to avoid performance issues
    filteredAssets.forEach(asset => {
      const visualMirrorId = `asset_${asset.id}`;
      showContent(visualMirrorId, { imageUrl: asset.url });
    });
  }, [filteredAssets, showContent]);

  // Reset playing state when tab changes
  useEffect(() => {
    if (previousTabRef.current !== activeTab) {
      setPlayingAsset(null);
      previousTabRef.current = activeTab;
    }
  }, [activeTab]);

  // Handle drag start for assets
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, item: any) => {
    // Create the node data with proper format
    const nodeData = {
      title: item.title || (item.type === "video" ? "VIDEO TITLE" : "IMAGE TITLE"),
      showImage: true,
      category: item.type,
      imageUrl: item.url,
      seed: Math.floor(Math.random() * 1000000000).toString(),
      content: item.description || "",
      isNewNode: true,
    }
    
    // Important: Set the drag data in the exact format expected by ReactFlow
    e.dataTransfer.setData("application/reactflow", JSON.stringify({
      type: item.type === "video" ? "video" : "image",
      data: nodeData
    }))
    
    e.dataTransfer.effectAllowed = "move"
  }, [])

  // Toggle video playback
  const toggleVideoPlay = useCallback((assetId: string) => {
    setPlayingAsset(current => current === assetId ? null : assetId);
  }, []);
  
  // Handle asset click to open preview
  const handleAssetClick = useCallback((asset: any) => {
    setPreviewAsset(asset);
  }, []);
  
  // Handle download
  const handleDownload = useCallback((url: string) => {
    if (!url) return;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `asset_${Date.now()}.${url.endsWith('.mp4') ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Render an asset item with optimized media loading
  const renderAssetItem = useCallback(
    (asset: any, index: number) => {
      const isVideo = asset.type === "video" || 
                      asset.url.endsWith('.mp4') || 
                      asset.url.endsWith('.webm') || 
                      asset.url.endsWith('.gif');
      
      const isPlaying = playingAsset === asset.id;
      
      return (
        <div 
          key={asset.id} 
          className="relative group w-full mb-3" 
          draggable 
          onDragStart={(e) => handleDragStart(e, asset)}
        >
          <div 
            className="w-full overflow-hidden border border-gray-800 bg-gray-900 cursor-pointer"
            onClick={() => handleAssetClick(asset)}
          >
            {isVideo ? (
              // Video preview - no controls, just a preview
              <video 
                src={asset.url} 
                className="w-full object-contain"
                muted
                autoPlay={false}
                controls={false}
                loop={false}
                preload="metadata"
                poster={asset.thumbnail || undefined}
              />
            ) : (
              <img
                src={asset.url || "/placeholder.svg"}
                alt={asset.title || `Asset ${index}`}
                className="w-full object-contain"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <div className="text-[9px] text-gray-400 truncate">
              {asset.title || (isVideo ? "Video" : "Image")}
            </div>
            <div className="flex gap-1">
              <button
                className="p-0.5 rounded-sm hover:bg-gray-800 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(asset.url);
                }}
              >
                <Download className="h-2.5 w-2.5" />
              </button>
              <button
                className="bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAsset(asset.id);
                }}
              >
                <X className="h-3 w-3 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [handleDragStart, removeAsset, playingAsset, handleAssetClick, handleDownload],
  )

  return (
    <div className="flex flex-col node-gradient bg-black border border-gray-800/50 rounded-xl shadow-sm overflow-hidden w-[260px] font-mono">
      {/* Panel header */}
      <div className="flex justify-between items-center p-2.5 border-b border-gray-800/50">
        <h2 className="text-[11px] font-medium text-gray-300 uppercase tracking-wider">ASSET BOARD</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300">
          <Share className="h-4 w-4" />
        </Button>
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

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {filteredAssets.length > 0 ? (
          <div className="flex flex-col">
            {filteredAssets.map((asset, index) => renderAssetItem(asset, index))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
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
              {activeTab === "images" ? "Images" : "Videos"} will appear here when generated
            </p>
          </div>
        )}
      </div>
      
      {/* Fullscreen Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="bg-black/95 border border-gray-800 p-0 max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-xl overflow-hidden">
          <DialogTitle className="sr-only">
            {previewAsset?.type === "video" ? "Video Preview" : "Image Preview"}
          </DialogTitle>
          <div className="w-full h-full flex items-center justify-center">
            {previewAsset && (
              previewAsset.type === "video" || 
              previewAsset.url?.endsWith('.mp4') || 
              previewAsset.url?.endsWith('.webm') || 
              previewAsset.url?.endsWith('.gif') ? (
                <video 
                  key={`video-preview-${previewAsset.id}`}
                  src={previewAsset.url} 
                  className="max-h-[80vh] max-w-full object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.title || "Asset Preview"}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              )
            )}
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="p-1.5 rounded bg-black/70 text-white hover:bg-black/90"
              onClick={() => previewAsset && handleDownload(previewAsset.url)}
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

