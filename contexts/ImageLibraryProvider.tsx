"use client"

import type React from "react"
import { createContext, useState, useEffect, useCallback } from "react"

// Update the interface to include more metadata
interface SavedAsset {
  id: string
  url: string
  type: "image" | "video"
  title: string
  description?: string
  settings?: Record<string, any>
  timestamp: number
}

interface ImageLibraryContextType {
  savedAssets: SavedAsset[]
  addAsset: (asset: Omit<SavedAsset, "id" | "timestamp">) => void
  removeAsset: (id: string) => void
}

// Create context with default values
export const ImageLibraryContext = createContext<ImageLibraryContextType>({
  savedAssets: [],
  addAsset: () => {},
  removeAsset: () => {},
})

export const ImageLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available, otherwise empty array
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedAssets")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Save to localStorage whenever savedAssets changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedAssets", JSON.stringify(savedAssets))
    }
  }, [savedAssets])

  // Add a new asset to the library
  const addAsset = useCallback((asset: Omit<SavedAsset, "id" | "timestamp">) => {
    setSavedAssets((prev) => {
      // Generate a unique ID
      const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create the new asset with ID and timestamp
      const newAsset: SavedAsset = {
        ...asset,
        id,
        timestamp: Date.now(),
      }

      return [...prev, newAsset]
    })
  }, [])

  // Remove an asset from the library
  const removeAsset = useCallback((id: string) => {
    setSavedAssets((prev) => prev.filter((asset) => asset.id !== id))
  }, [])

  return (
    <ImageLibraryContext.Provider
      value={{
        savedAssets,
        addAsset,
        removeAsset,
      }}
    >
      {children}
    </ImageLibraryContext.Provider>
  )
}

