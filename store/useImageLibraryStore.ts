import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

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

// Maximum number of assets to keep in storage
const MAX_STORED_ASSETS = 20;

export const useImageLibraryStore = create<ImageLibraryState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        savedAssets: [],

        // Actions
        addAsset: (asset) =>
          set((state) => {
            try {
              // Generate a unique ID
              const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

              // Create the new asset with ID and timestamp
              const newAsset: SavedAsset = {
                ...asset,
                id,
                timestamp: Date.now(),
              }

              // Get current assets
              let updatedAssets = [...state.savedAssets, newAsset];
              
              // If we exceed the maximum, remove the oldest assets
              if (updatedAssets.length > MAX_STORED_ASSETS) {
                // Sort by timestamp (oldest first) and take only the most recent MAX_STORED_ASSETS
                updatedAssets = updatedAssets
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .slice(-MAX_STORED_ASSETS);
              }

              return { savedAssets: updatedAssets }
            } catch (error) {
              // Handle any storage errors gracefully
              console.error("Failed to add asset to storage:", error);
              return state; // Return unchanged state
            }
          }),

        removeAsset: (id) =>
          set((state) => ({
            savedAssets: state.savedAssets.filter((asset) => asset.id !== id),
          })),

        // Derived data
        getSavedImages: () => get().savedAssets.map((asset) => asset.url),
      }),
      {
        name: "image-library-storage",
      },
    ),
  ),
)

