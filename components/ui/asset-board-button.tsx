"use client"

import { useState, Suspense, lazy } from "react"
import { Folders } from "lucide-react"
import { Button } from "@/components/ui/button"

// Lazy load AssetBoardPanel to break the store dependency cycle
const AssetBoardPanel = lazy(() => import("@/components/panels/AssetBoardPanel"))

/**
 * Asset Board Button Component
 * 
 * Toggles the display of the Asset Board panel
 */
export default function AssetBoardButton() {
  const [isOpen, setIsOpen] = useState(false)

  // Using a simple toggle approach
  const togglePanel = () => setIsOpen(prev => !prev)

  return (
    <div className="absolute top-4 right-4 z-50">
      <Button
        onClick={togglePanel}
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-gray-900 border-gray-800 shadow-md hover:bg-gray-800"
        title="Toggle Asset Board"
      >
        <Folders className="h-5 w-5 text-gray-300" />
      </Button>

      {isOpen && (
        <div className="absolute top-0 -left-[350px] shadow-xl z-50" style={{ maxHeight: 'calc(100vh - 30px)' }}>
          <Suspense fallback={<div className="h-[min(calc(100vh-30px),400px)] w-[350px] bg-black node-gradient border border-gray-800/50 rounded-xl flex items-center justify-center text-sm text-gray-400">Loading...</div>}>
            <AssetBoardPanel />
          </Suspense>
        </div>
      )}
    </div>
  )
} 