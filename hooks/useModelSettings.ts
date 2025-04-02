"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getVideoModelById, getDefaultSettings } from "@/lib/utils/schema-loader"

export function useModelSettings(
  initialModelId: string,
  initialSettings: Record<string, any> | undefined,
  onModelChange?: (modelId: string, settings: Record<string, any>) => void,
) {
  // Initialize model state from data or defaults
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || "wan-pro")
  const [modelSettings, setModelSettings] = useState<Record<string, any>>(
    initialSettings || getDefaultSettings(selectedModelId),
  )

  // Refs to prevent infinite loops
  const isInitialMount = useRef(true)
  const modelChangeRef = useRef(false)

  // Memoized handlers to prevent unnecessary re-renders
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    modelChangeRef.current = true
  }, [])

  const handleSettingsChange = useCallback((settings: Record<string, any>) => {
    setModelSettings(settings)
  }, [])

  // Effect to notify parent of model changes, but only when necessary
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Only call onModelChange if it exists and we have a real change
    if (onModelChange && modelChangeRef.current) {
      onModelChange(selectedModelId, modelSettings)
      modelChangeRef.current = false
    }
  }, [selectedModelId, modelSettings, onModelChange])

  return {
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
    selectedModel: getVideoModelById(selectedModelId),
  }
}

