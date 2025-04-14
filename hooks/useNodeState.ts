"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useFlowchartStore } from "@/store/useFlowchartStore"

// Create stable selectors for the store actions
const setIsInteractingWithInputSelector = (state: any) => state.setIsInteractingWithInput
const updateNodeQualitySelector = (state: any) => state.updateNodeQuality
const updateNodeStrengthSelector = (state: any) => state.updateNodeStrength
const updateNodeNumbersSelector = (state: any) => state.updateNodeNumbers
const updateNodeModelSelector = (state: any) => state.updateNodeModel
const updateNodeModelSettingsSelector = (state: any) => state.updateNodeModelSettings
const updateNodeContentSelector = (state: any) => state.updateNodeContent

interface UseNodeStateProps {
  id: string
  data: any
  initialModelId?: string
}

/**
 * Hook for managing node state (now as a thin wrapper around the central store)
 */
export function useNodeState({ id, data, initialModelId = "flux-dev" }: UseNodeStateProps) {
  // Use the store with stable selectors
  const setIsInteractingWithInput = useFlowchartStore(setIsInteractingWithInputSelector)
  const updateNodeQuality = useFlowchartStore(updateNodeQualitySelector)
  const updateNodeStrength = useFlowchartStore(updateNodeStrengthSelector)
  const updateNodeNumbers = useFlowchartStore(updateNodeNumbersSelector)
  const updateNodeModel = useFlowchartStore(updateNodeModelSelector)
  const updateNodeModelSettings = useFlowchartStore(updateNodeModelSettingsSelector)
  const updateNodeContent = useFlowchartStore(updateNodeContentSelector)
  
  // Keep some local state for UI interactions that don't need persistence
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5)
  
  // State for model ID and other settings
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId || "flux-dev")
  const [modelSettings, setModelSettings] = useState<Record<string, any>>(data?.modelSettings || {})
  const [negativePrompt, setNegativePrompt] = useState<string>(data?.negativePrompt || "")
  const [loraUrls, setLoraUrls] = useState<string[]>(data?.loraUrls || [])

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
  
  const setNumbers = useCallback((numbers: string | number) => {
    updateNodeNumbers(id, numbers);
  }, [id, updateNodeNumbers]);
  
  const handleModelChange = useCallback((modelId: string) => {
    console.log(`[useNodeState] Changing model for node ${id} to: ${modelId}`);
    
    // Update the node's model ID in the Flowchart store
    updateNodeModel(id, modelId);
    
    // If the node has model-specific settings, we could reset or update them here
    // For now, let's just log the change
    console.log(`[useNodeState] Model changed for node ${id}: ${modelId}`);
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

  // Add negativePrompt handler
  const handleNegativePromptChange = useCallback((text: string) => {
    setNegativePrompt(text);
    // Store negativePrompt in the model settings
    handleSettingsChange({ ...modelSettings, negativePrompt: text });
  }, [modelSettings, handleSettingsChange]);

  // Add loraUrls handler
  const handleLoraUrlsChange = useCallback((urls: string[]) => {
    // Ensure we're working with a proper array
    const validUrls = Array.isArray(urls) ? [...urls] : [];
    
    // Don't update if the array is empty except for one empty string
    if (validUrls.length === 1 && validUrls[0] === '' && loraUrls.length === 0) {
      console.log("Skipping redundant loraUrls update with empty string");
      return; 
    }
    
    console.log("Updating loraUrls state:", validUrls);
    setLoraUrls(validUrls);
    
    // Store in the model settings
    console.log("Updating loraUrls in model settings:", validUrls);
    handleSettingsChange({ 
      ...modelSettings, 
      loraUrls: validUrls 
    });
  }, [modelSettings, handleSettingsChange, loraUrls]);

  return {
    quality: data.quality || 80,
    setQuality,
    seed: data.seed || Math.floor(Math.random() * 1000000000).toString(),
    numbers: data.numbers || data.seed || Math.floor(Math.random() * 1000000000).toString(), 
    setNumbers,
    isNewNode: data.isNewNode || false,
    isSubmitting,
    timeRemaining,
    isGenerated,
    handleSubmitToggle,
    strength: data.strength || 70,
    setStrength,
    selectedModelId,
    modelSettings,
    handleModelChange,
    handleSettingsChange,
    handleInputInteraction,
    nodeProps,
    negativePrompt,
    handleNegativePromptChange,
    loraUrls,
    handleLoraUrlsChange,
  }
}

