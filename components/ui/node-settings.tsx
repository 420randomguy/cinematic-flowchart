"use client"

import { memo, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import ModelSelector from "@/components/ui/ModelSelector"
import type { NodeSettingsProps } from "@/types/node-props"
import { useMemoization } from "@/hooks/useMemoization"

/**
 * Reusable node settings component for quality, seed, strength, and model settings
 */
function NodeSettingsComponent({
  quality,
  setQuality,
  seed,
  strength,
  setStrength,
  selectedModelId,
  modelSettings,
  handleModelChange,
  handleSettingsChange,
  data,
  showSizeSelector = true,
  defaultSize = "16:9",
  content,
  className = "",
}: NodeSettingsProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Get the comparison function from the hook
  const { nodeSettingsComparison } = useMemoization()

  // Use refs to track previous values for memoization
  const prevQualityRef = useRef(quality)
  const prevStrengthRef = useRef(strength)
  const prevSeedRef = useRef(seed)
  const prevModelIdRef = useRef(selectedModelId)

  // Only update refs when values actually change
  if (quality !== prevQualityRef.current) prevQualityRef.current = quality
  if (strength !== prevStrengthRef.current) prevStrengthRef.current = strength
  if (seed !== prevSeedRef.current) prevSeedRef.current = seed
  if (selectedModelId !== prevModelIdRef.current) prevModelIdRef.current = selectedModelId

  return (
    <div className={`space-y-1 pt-1 border-t border-gray-800/50 ${className}`}>
      {/* Section heading */}
      <div className="text-[9px] uppercase text-gray-500 tracking-wide font-bold mb-2">MODEL SETTINGS</div>

      {/* Quality slider */}
      <div className="flex justify-between items-center">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">QUALITY</div>
        <div className="text-[9px] text-gray-400">{prevQualityRef.current}</div>
      </div>
      <Slider
        value={[prevQualityRef.current]}
        min={1}
        max={100}
        step={1}
        onValueChange={(value) => setQuality(value[0])}
        className="w-full h-1.5"
        {...interactiveProps}
      />

      {/* Strength slider (for image-to-image) */}
      {strength !== undefined && setStrength && (
        <>
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">STRENGTH</div>
            <div className="text-[9px] text-gray-400">{prevStrengthRef.current}%</div>
          </div>
          <Slider
            value={[prevStrengthRef.current]}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => setStrength(value[0])}
            className="w-full h-1.5"
            {...interactiveProps}
          />
        </>
      )}

      {/* Seed display */}
      <div className="flex justify-between items-center pt-1">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
        <div className="text-[9px] text-gray-400 font-mono">{prevSeedRef.current}</div>
      </div>

      {/* Size selector */}
      {showSizeSelector && (
        <div className="flex justify-between items-center pt-1">
          <div className="text-[9px] uppercase text-gray-500 tracking-wide">SIZE</div>
          <Select defaultValue={defaultSize} {...interactiveProps}>
            <SelectTrigger
              className="h-5 w-[60px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0"
              {...interactiveProps}
            >
              <SelectValue placeholder={defaultSize} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
              <SelectItem value="16:9" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                16:9
              </SelectItem>
              <SelectItem value="9:16" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                9:16
              </SelectItem>
              <SelectItem value="3:4" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                3:4
              </SelectItem>
              <SelectItem value="4:3" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                4:3
              </SelectItem>
              <SelectItem value="1:1" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                1:1
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Model settings */}
      {selectedModelId && handleModelChange && modelSettings && handleSettingsChange && data && (
        <ModelSelector
          selectedModelId={prevModelIdRef.current}
          onModelChange={handleModelChange}
          settings={modelSettings}
          onSettingsChange={handleSettingsChange}
          className="pt-2"
          data={data}
        />
      )}
    </div>
  )
}

// Use our optimized memoization system
export const NodeSettings = memo(NodeSettingsComponent, (prevProps, nextProps) => {
  const { nodeSettingsComparison } = useMemoization()
  return nodeSettingsComparison(prevProps, nextProps)
})

