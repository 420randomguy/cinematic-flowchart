import { create } from "zustand"

// Define the asset type
export interface SavedAsset {
  id: string
  url: string
  type: "image" | "video"
  title: string
  description?: string
  settings?: Record<string, any>
  timestamp: number
}

// Define the image library state
interface ImageLibraryState {
  // State
  savedAssets: SavedAsset[]

  // Actions
  addAsset: (asset: Omit<SavedAsset, "id" | "timestamp">) => void
  removeAsset: (id: string) => void

  // Derived data (for backward compatibility)
  getSavedImages: () => string[]
}

// Simple in-memory store with no persistence
export const useImageLibraryStore = create<ImageLibraryState>((set, get) => ({
  // Initial state
  savedAssets: [],

  // Actions
  addAsset: (asset) => {
    // Generate a unique ID
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the new asset with ID and timestamp
    const newAsset: SavedAsset = {
      ...asset,
      id,
      timestamp: Date.now(),
    }

    // Update state with the new asset (no limit)
    set((state) => ({ 
      savedAssets: [...state.savedAssets, newAsset] 
    }))
  },

  removeAsset: (id) =>
    set((state) => ({
      savedAssets: state.savedAssets.filter((asset) => asset.id !== id),
    })),

  // Derived data
  getSavedImages: () => get().savedAssets.map((asset) => asset.url),
}))

