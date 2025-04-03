"use client"

import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchart } from "@/contexts/FlowchartContext"
import ModelSelector from "@/components/ui/ModelSelector"

interface NodeSettingsProps {
  quality: number
  setQuality: (quality: number) => void
  seed: string | number
  strength?: number
  setStrength?: (strength: number) => void
  selectedModelId?: string
  modelSettings?: Record<string, any>
  handleModelChange?: (modelId: string) => void
  handleSettingsChange?: (settings: Record<string, any>) => void
  data?: any
  showSizeSelector?: boolean
  defaultSize?: string
  content?: string
  className?: string
}

/**
 * Reusable node settings component for quality, seed, strength, and model settings
 */
export function NodeSettings({
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
  const { handleInputInteraction } = useFlowchart()
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <div className={`space-y-1 pt-1 border-t border-gray-800/50 ${className}`}>
      {/* Quality slider */}
      <div className="flex justify-between items-center">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">QUALITY</div>
        <div className="text-[9px] text-gray-400">{quality}</div>
      </div>
      <Slider
        value={[quality]}
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
            <div className="text-[9px] text-gray-400">{strength}%</div>
          </div>
          <Slider
            value={[strength]}
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
        <div className="text-[9px] text-gray-400 font-mono">{seed}</div>
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
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          settings={modelSettings}
          onSettingsChange={handleSettingsChange}
          className="pt-2"
          data={data}
        />
      )}

      {/* Optional prompt text */}
      {content && (
        <div
          className="text-[9px] text-yellow-300/90 mt-3 mb-1 font-mono tracking-wide border-t border-gray-800/50 pt-2 line-clamp-2"
          {...interactiveProps}
        >
          {typeof content === "string" ? content.substring(0, 100) + (content.length > 100 ? "..." : "") : ""}
        </div>
      )}
    </div>
  )
}

