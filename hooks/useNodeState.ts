"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Create stable selector outside the hook
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput

interface UseNodeStateProps {
  id: string
  data: any
  initialModelId?: string
}

/**
 * Hook for managing node state
 */
export function useNodeState({ id, data, initialModelId }: UseNodeStateProps) {
  // Use the store with stable selector
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting);
    },
    [setIsInteractingWithInput]
  );

  // Basic state
  const [quality, setQuality] = useState(data.quality || 80)
  const [seed] = useState(data.seed || Math.floor(Math.random() * 1000000000).toString())
  const [isNewNode] = useState(data.isNewNode || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  const [strength, setStrength] = useState(data.strength || 70)
  const [selectedModelId, setSelectedModelId] = useState(initialModelId || data.modelId || "flux-dev")
  const [modelSettings, setModelSettings] = useState(data.modelSettings || {})

  // Handle model change
  const handleModelChange = useCallback(
    (modelId: string) => {
      setSelectedModelId(modelId)
      data.modelId = modelId
    },
    [data],
  )

  // Handle settings change
  const handleSettingsChange = useCallback(
    (settings: any) => {
      setModelSettings(settings)
      data.modelSettings = settings
    },
    [data],
  )

  // Handle submit toggle
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      setIsSubmitting(false)
      setTimeRemaining(5)
    } else if (isGenerated) {
      // Handle regeneration
      setIsSubmitting(true)
      setIsGenerated(false)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    } else {
      // Handle initial generation
      setIsSubmitting(true)

      // Simulate generation process
      let time = 5
      const interval = setInterval(() => {
        time--
        setTimeRemaining(time)

        if (time <= 0) {
          clearInterval(interval)
          setIsSubmitting(false)
          setIsGenerated(true)
        }
      }, 1000)
    }
  }, [isSubmitting, isGenerated])

  // Update data when quality changes
  useEffect(() => {
    data.quality = quality
  }, [data, quality])

  // Update data when strength changes
  useEffect(() => {
    if (strength !== undefined) {
      data.strength = strength
    }
  }, [data, strength])

  // Ensure data is updated when state changes
  useEffect(() => {
    // Ensure data is updated when state changes
    if (data) {
      data.quality = quality
      data.strength = strength
      data.modelId = selectedModelId
      data.modelSettings = modelSettings
    }
  }, [data, quality, strength, selectedModelId, modelSettings])

  // Memoize common node props to prevent unnecessary re-renders
  const nodeProps = {
    title: data.title || "",
    content: data.content || "",
    imageUrl: data.imageUrl || null,
    seed: data.seed || Math.floor(Math.random() * 1000000000).toString(),
    quality: data.quality || 80,
    modelId: data.modelId || "default",
    modelSettings: data.modelSettings || {},
    sourceNodeContent: data.sourceNodeContent || "",
  }

  return {
    quality,
    setQuality,
    seed,
    isNewNode,
    isSubmitting,
    timeRemaining,
    isGenerated,
    handleSubmitToggle,
    strength,
    setStrength,
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
    handleInputInteraction,
    nodeProps,
  }
}

