"use client"

import type React from "react"
import { useState } from "react"

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

  // Improved drag start handler with better data transfer
  const handleDragStart = (e: React.DragEvent, item: any) => {
    // Set the drag data with complete node information
    e.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: "video",
        data: {
          title: item.title,
          showImage: true,
          category: "video",
          imageUrl: item.src,
          seed: Math.floor(Math.random() * 1000000000).toString(),
          content: item.description || "",
          caption: item.caption || null,
          isNewNode: true,
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

  // Sample asset items with more complete data
  const assetItems = [
    {
      title: "INTIMATE POETRY CLOSE-UP",
      type: "Image",
      src: "/sample-image.png",
      alt: "Poetry close-up",
      caption: null,
      description: "Close-up shot of vintage poem page with subtle lighting highlighting the texture of the paper.",
    },
    {
      title: "OVER-THE-SHOULDER INTERACTION",
      type: "Video",
      src: "/sample-image.png",
      alt: "Over-the-shoulder shot",
      caption: "It is the z aileen are for by teapuit he upsh it bill",
      description: "Over-the-shoulder shot showing intimate conversation between characters.",
    },
    {
      title: "INTIMATE TRAIN CONVERSATIONS",
      type: "Video",
      src: "/sample-image.png",
      alt: "Train conversations",
      caption: null,
      description: "Scene depicting intimate conversations in a train setting with atmospheric lighting.",
    },
    {
      title: "VINTAGE BOOK TEXTURE",
      type: "Image",
      src: "/sample-image.png",
      alt: "Vintage book texture",
      caption: null,
      description: "Close-up texture of vintage book pages with visible grain and aging patterns.",
    },
    {
      title: "CINEMATIC LIGHTING STUDY",
      type: "Image",
      src: "/sample-image.png",
      alt: "Cinematic lighting",
      caption: null,
      description: "Study of cinematic lighting techniques with dramatic shadows and highlights.",
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <div className="text-sm font-medium text-white">Asset Board</div>
        <Button variant="ghost" size="sm" className="text-white">
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6" id="asset-board">
          {assetItems.map((item, index) => (
            <div key={index} className="space-y-1" draggable="true" onDragStart={(e) => handleDragStart(e, item)}>
              <div className="flex justify-between items-center">
                <div className="text-xs uppercase text-gray-400">{item.title}</div>
                <div className="text-[9px] uppercase bg-black text-gray-300 px-1.5 py-0.5 rounded-sm">{item.type}</div>
              </div>
              <div
                className="relative aspect-video bg-black rounded overflow-hidden cursor-grab"
                onClick={() => setSelectedImage({ src: item.src, alt: item.alt, title: item.title })}
              >
                <Image
                  src={item.src || "/placeholder.svg"}
                  alt={item.alt}
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
          ))}
        </div>
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
    </div>
  )
}

