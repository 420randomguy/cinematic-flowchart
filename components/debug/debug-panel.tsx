"use client"

import { useState, useEffect } from "react"
import { Bug, X, Database, Trash2, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ConnectionStatus = "disconnected" | "connecting" | "connected"

interface ApiStatus {
  supabase: ConnectionStatus
  falAi: ConnectionStatus
}

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    supabase: "disconnected",
    falAi: "disconnected",
  })
  const [isClearing, setIsClearing] = useState(false)

  // Simulate checking API connections
  useEffect(() => {
    if (isOpen) {
      // Set status to connecting
      setApiStatus({
        supabase: "connecting",
        falAi: "connecting",
      })

      // Simulate API connection checks
      const checkSupabase = setTimeout(() => {
        setApiStatus((prev) => ({
          ...prev,
          supabase: localStorage.getItem("supabase_key") ? "connected" : "disconnected",
        }))
      }, 800)

      const checkFalAi = setTimeout(() => {
        setApiStatus((prev) => ({
          ...prev,
          falAi: localStorage.getItem("fal_ai_key") ? "connected" : "disconnected",
        }))
      }, 1200)

      return () => {
        clearTimeout(checkSupabase)
        clearTimeout(checkFalAi)
      }
    }
  }, [isOpen])

  const handleClearCache = () => {
    setIsClearing(true)

    // Simulate clearing cache
    setTimeout(() => {
      // Clear relevant localStorage items
      localStorage.removeItem("savedImages")
      localStorage.removeItem("flowchart_state")

      // You can add more cache clearing logic here

      setIsClearing(false)

      // Show success message or update UI
      alert("Cache cleared successfully")
    }, 1000)
  }

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      case "disconnected":
      default:
        return "bg-red-500"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {/* Debug Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 rounded-full bg-black border border-gray-800 hover:bg-gray-900 hover:border-gray-700"
            >
              <Bug className="h-4 w-4 text-gray-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Debug Panel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-10 right-0 bg-black border border-gray-800 rounded-md shadow-lg p-3 w-64 text-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-300 font-medium">Debug Panel</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-5 w-5 text-gray-500 hover:text-gray-300"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            {/* Supabase Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">Supabase</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(apiStatus.supabase)}`}></div>
                <span className="text-gray-400">
                  {apiStatus.supabase === "connected"
                    ? "Connected"
                    : apiStatus.supabase === "connecting"
                      ? "Checking..."
                      : "Not Connected"}
                </span>
              </div>
            </div>

            {/* Fal.ai Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">Fal.ai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(apiStatus.falAi)}`}></div>
                <span className="text-gray-400">
                  {apiStatus.falAi === "connected"
                    ? "Connected"
                    : apiStatus.falAi === "connecting"
                      ? "Checking..."
                      : "Not Connected"}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 my-2"></div>

            {/* Clear Cache Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full h-7 text-[10px] bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-300"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Clear Cache
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

