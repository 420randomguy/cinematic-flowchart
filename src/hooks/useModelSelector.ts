"use client"

import { useState, useEffect, useCallback } from "react"
import { useModelStore } from "@/store/modelStore"
import type { ModelCategory } from "@/types/model-types"
import { getModelsByCategory } from "@/models/registry"

interface UseModelSelectorProps {
  category: ModelCategory
  initialModelId?: string
  onModelChange?: (modelId: string, settings: Record<string, any>) => void
}

export function useModelSelector({ category, initialModelId, onModelChange }: UseModelSelectorProps) {
  // Get state and actions from the model store
  const { selectedModels, modelSettings, setSelectedModel, updateModelSettings, resetModelSettings } = useModelStore()

  // Get available models for this category
  const availableModels = getModelsByCategory(category)

  // Use the initial model ID if provided, otherwise use the selected model from the store
  const [selectedModelId, setSelectedModelId] = useState(
    initialModelId || selectedModels[category] || availableModels[0]?.id || "",
  )

  // Get settings for the selected model
  const [settings, setSettings] = useState(modelSettings[selectedModelId] || {})

  // Update local state when the selected model changes in the store
  useEffect(() => {
    if (!initialModelId && selectedModels[category] !== selectedModelId) {
      setSelectedModelId(selectedModels[category])
    }
  }, [category, initialModelId, selectedModels, selectedModelId])

  // Update local state when the model settings change in the store
  useEffect(() => {
    if (modelSettings[selectedModelId] !== settings) {
      setSettings(modelSettings[selectedModelId] || {})
    }
  }, [modelSettings, selectedModelId, settings])

  // Handle model change
  const handleModelChange = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId)

      // Update the selected model in the store if no initial model ID was provided
      if (!initialModelId) {
        setSelectedModel(category, modelId)
      }

      // Get settings for the new model
      const newSettings = modelSettings[modelId] || {}
      setSettings(newSettings)

      // Call the onModelChange callback if provided
      if (onModelChange) {
        onModelChange(modelId, newSettings)
      }
    },
    [category, initialModelId, modelSettings, onModelChange, setSelectedModel],
  )

  // Handle settings change
  const handleSettingsChange = useCallback(
    (newSettings: Record<string, any>) => {
      setSettings(newSettings)

      // Update the model settings in the store
      updateModelSettings(selectedModelId, newSettings)

      // Call the onModelChange callback if provided
      if (onModelChange) {
        onModelChange(selectedModelId, newSettings)
      }
    },
    [onModelChange, selectedModelId, updateModelSettings],
  )

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    resetModelSettings(selectedModelId)

    // Get the default settings
    const defaultSettings = modelSettings[selectedModelId] || {}
    setSettings(defaultSettings)

    // Call the onModelChange callback if provided
    if (onModelChange) {
      onModelChange(selectedModelId, defaultSettings)
    }
  }, [modelSettings, onModelChange, resetModelSettings, selectedModelId])

  return {
    selectedModelId,
    settings,
    availableModels,
    handleModelChange,
    handleSettingsChange,
    resetSettings,
  }
}

