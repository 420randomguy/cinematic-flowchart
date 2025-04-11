"use client"

import { useState } from "react"
import { Folders } from "lucide-react"
import { Button } from "@/components/ui/button"
import AssetBoardPanel from "@/components/panels/AssetBoardPanel"

/**
 * Asset Board Button Component
 * 
 * Toggles the display of the Asset Board panel
 */
export default function AssetBoardButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute right-4 top-16 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-gray-900 border-gray-800 shadow-md hover:bg-gray-800"
        title="Toggle Asset Board"
      >
        <Folders className="h-5 w-5 text-gray-300" />
      </Button>

      {isOpen && (
        <div className="absolute top-0 -left-[280px] shadow-xl z-50">
          <AssetBoardPanel />
        </div>
      )}
    </div>
  )
} 