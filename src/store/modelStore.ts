import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { ModelDefinition, ModelCategory, ModelRegistryState } from "@/types/model-types"
import { getAllModels, getModelById, getDefaultSettings } from "@/models/registry"

interface ModelStore extends ModelRegistryState {
  // Actions
  setSelectedModel: (category: ModelCategory, modelId: string) => void
  updateModelSettings: (modelId: string, settings: Record<string, any>) => void
  resetModelSettings: (modelId: string) => void

  // Selectors
  getSelectedModel: (category: ModelCategory) => ModelDefinition | undefined
  getModelSettings: (modelId: string) => Record<string, any>
}

export const useModelStore = create<ModelStore>()(
  devtools(
    persist(
      (set, get) => {
        // Initialize with all available models
        const allModels = getAllModels()

        // Create initial selected models map
        const initialSelectedModels: Record<ModelCategory, string> = {
          "text-to-image": "flux-dev",
          "image-to-image": "flux-dev",
          "text-to-video": "kling-1.6",
          "image-to-video": "wan-pro",
          "text-to-3d": "",
          upscaler: "",
          inpainting: "",
        }

        // Create initial model settings map
        const initialModelSettings: Record<string, Record<string, any>> = {}
        allModels.forEach((model) => {
          initialModelSettings[model.id] = getDefaultSettings(model.id)
        })

        return {
          // State
          models: allModels,
          selectedModels: initialSelectedModels,
          modelSettings: initialModelSettings,

          // Actions
          setSelectedModel: (category, modelId) =>
            set((state) => ({
              selectedModels: {
                ...state.selectedModels,
                [category]: modelId,
              },
            })),

          updateModelSettings: (modelId, settings) =>
            set((state) => ({
              modelSettings: {
                ...state.modelSettings,
                [modelId]: {
                  ...state.modelSettings[modelId],
                  ...settings,
                },
              },
            })),

          resetModelSettings: (modelId) =>
            set((state) => ({
              modelSettings: {
                ...state.modelSettings,
                [modelId]: getDefaultSettings(modelId),
              },
            })),

          // Selectors
          getSelectedModel: (category) => {
            const modelId = get().selectedModels[category]
            return getModelById(modelId)
          },

          getModelSettings: (modelId) => {
            return get().modelSettings[modelId] || getDefaultSettings(modelId)
          },
        }
      },
      {
        name: "model-store",
      },
    ),
  ),
)

