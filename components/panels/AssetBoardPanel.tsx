"use client"

import type React from "react"
import { useState, useContext } from "react"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Share, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function AssetBoardPanel() {
  const [selectedImage, setSelectedImage] = useState<{
    src: string
    alt: string
    title: string
  } | null>(null)

  const { savedAssets } = useContext(ImageLibraryContext)

  // Improved drag start handler with better data transfer
  const handleDragStart = (e: React.DragEvent, item: any) => {
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
  }

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
        <div className="text-xs font-medium text-gray-300">Asset Board</div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300">
          <Share className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="bg-black border border-gray-800/50 rounded-sm p-4 space-y-6 overflow-auto flex-1 h-[calc(100vh-45px)]"
        id="asset-board"
      >
        {savedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>No assets yet</p>
            <p className="text-xs mt-2">Generate content or upload images to see them here</p>
          </div>
        ) : (
          savedAssets.map((item, index) => (
            <div key={item.id} className="space-y-1" draggable="true" onDragStart={(e) => handleDragStart(e, item)}>
              <div className="flex justify-between items-center">
                <div className="text-xs uppercase text-gray-400">{item.title}</div>
                <div className="text-[9px] uppercase bg-black text-gray-300 px-1.5 py-0.5 rounded-sm">{item.type}</div>
              </div>
              <div
                className="relative aspect-video bg-black rounded overflow-hidden cursor-grab"
                onClick={() => setSelectedImage({ src: item.url, alt: item.title, title: item.title })}
              >
                <img
                  src={item.url || "/placeholder.svg"}
                  alt={item.title}
                  width={600}
                  height={400}
                  className="object-cover"
                />
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-yellow-300 text-xs">
                    {item.caption}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full-screen image dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black border border-gray-800">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/70 rounded-full p-1 text-white hover:bg-black"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="text-sm text-white p-3 bg-black/80 absolute top-0 left-0 right-0">
              {selectedImage?.title}
            </div>
            {selectedImage && (
              <div className="flex items-center justify-center h-[80vh]">
                <Image
                  src={selectedImage.src || "/placeholder.svg"}
                  alt={selectedImage.alt}
                  width={1200}
                  height={800}
                  className="max-h-[80vh] max-w-[90vw] object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

