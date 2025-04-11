"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Create stable selectors for the store actions
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput
const updateNodeQualitySelector = (state: any) => state.updateNodeQuality
const updateNodeStrengthSelector = (state: any) => state.updateNodeStrength
const updateNodeModelSelector = (state: any) => state.updateNodeModel
const updateNodeModelSettingsSelector = (state: any) => state.updateNodeModelSettings

interface UseNodeStateProps {
  id: string
  data: any
  initialModelId?: string
}

/**
 * Hook for managing node state (now as a thin wrapper around the central store)
 */
export function useNodeState({ id, data, initialModelId }: UseNodeStateProps) {
  // Use the store with stable selectors
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const updateNodeQuality = useFlowchartStore(updateNodeQualitySelector)
  const updateNodeStrength = useFlowchartStore(updateNodeStrengthSelector)
  const updateNodeModel = useFlowchartStore(updateNodeModelSelector)
  const updateNodeModelSettings = useFlowchartStore(updateNodeModelSettingsSelector)
  
  // Keep some local state for UI interactions that don't need persistence
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  
  // Create wrapper functions that call the store
  const handleInputInteraction = useCallback(
    (isInteracting = false) => {
      setIsInteractingWithInput(isInteracting);
    },
    [setIsInteractingWithInput]
  );

  // Create wrappers around store functions
  const setQuality = useCallback((quality: number) => {
    updateNodeQuality(id, quality);
  }, [id, updateNodeQuality]);
  
  const setStrength = useCallback((strength: number) => {
    updateNodeStrength(id, strength);
  }, [id, updateNodeStrength]);
  
  const handleModelChange = useCallback((modelId: string) => {
    updateNodeModel(id, modelId);
  }, [id, updateNodeModel]);
  
  const handleSettingsChange = useCallback((settings: any) => {
    updateNodeModelSettings(id, settings);
  }, [id, updateNodeModelSettings]);

  // Handle submit toggle (keep this local since it's just UI state)
  const handleSubmitToggle = useCallback(() => {
    // Create a render node using the flowchart store
    const createRenderNode = useFlowchartStore((state) => state.createRenderNode)
    // Generate a request ID using current timestamp
    const requestId = Date.now().toString()
    createRenderNode(id, requestId)
  }, [id])

  // Memoize common node props to prevent unnecessary re-renders
  const nodeProps = useMemo(() => ({
    title: data.title || "",
    content: data.content || "",
    imageUrl: data.imageUrl || null,
    seed: data.seed || Math.floor(Math.random() * 1000000000).toString(),
    quality: data.quality || 80,
    modelId: data.modelId || "default",
    modelSettings: data.modelSettings || {},
    sourceNodeContent: data.sourceNodeContent || "",
  }), [data]);

  return {
    quality: data.quality || 80,
    setQuality,
    seed: data.seed || Math.floor(Math.random() * 1000000000).toString(),
    isNewNode: data.isNewNode || false,
    isSubmitting,
    timeRemaining,
    isGenerated,
    handleSubmitToggle,
    strength: data.strength || 70,
    setStrength,
    selectedModelId: data.modelId || initialModelId || "flux-dev",
    modelSettings: data.modelSettings || {},
    handleModelChange,
    handleSettingsChange,
    handleInputInteraction,
    nodeProps,
  }
}

