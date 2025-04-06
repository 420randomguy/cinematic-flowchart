"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Share, Maximize2, Download, RotateCcw, Layers, Ratio } from "lucide-react"

/**
 * ImagePreviewPanel Component
 *
 * Displays a panel with image previews
 *
 * @returns {JSX.Element} The ImagePreviewPanel component
 */
export default function ImagePreviewPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <div></div>
        <Button variant="ghost" size="sm" className="text-white">
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs uppercase text-gray-400">INTIMATE POETRY CLOSE-UP</div>
              <div className="text-[9px] uppercase bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded-sm">
                Image
              </div>
            </div>
            <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
              <Image src="/sample-image.png" alt="Poetry close-up" width={600} height={400} className="object-cover" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs uppercase text-gray-400">OVER-THE-SHOULDER INTERACTION</div>
              <div className="text-[9px] uppercase bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded-sm">Video</div>
            </div>
            <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
              <Image
                src="/sample-image.png"
                alt="Over-the-shoulder shot"
                width={600}
                height={400}
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-yellow-300 text-xs">
                It is the z aileen are for by teapuit he upsh it bill
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs uppercase text-gray-400">INTIMATE TRAIN CONVERSATIONS</div>
              <div className="text-[9px] uppercase bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded-sm">Video</div>
            </div>
            <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
              <Image
                src="/sample-image.png"
                alt="Train conversations"
                width={600}
                height={400}
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs uppercase text-gray-400">VINTAGE BOOK TEXTURE</div>
              <div className="text-[9px] uppercase bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded-sm">
                Image
              </div>
            </div>
            <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
              <Image
                src="/sample-image.png"
                alt="Vintage book texture"
                width={600}
                height={400}
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-xs uppercase text-gray-400">CINEMATIC LIGHTING STUDY</div>
              <div className="text-[9px] uppercase bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded-sm">
                Image
              </div>
            </div>
            <div className="relative aspect-video bg-gray-900 rounded overflow-hidden">
              <Image
                src="/sample-image.png"
                alt="Cinematic lighting"
                width={600}
                height={400}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 border-t border-gray-800 flex justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-gray-400">
            <Ratio className="h-4 w-4 mr-1" />
            1:1
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-gray-400">
            <Layers className="h-4 w-4 mr-1" />
            Flux Dev
          </Button>
        </div>
      </div>
    </div>
  )
}

