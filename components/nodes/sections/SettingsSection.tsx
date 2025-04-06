"use client"

import { memo, type ReactNode } from "react"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface SettingsSectionProps {
  children?: ReactNode
  className?: string
  title?: string
  quality?: number
  setQuality?: (quality: number) => void
  seed?: string | number
  strength?: number
  setStrength?: (strength: number) => void
  showSizeSelector?: boolean
  defaultSize?: string
}

function SettingsSectionComponent({
  children,
  className = "",
  title = "SETTINGS",
  quality,
  setQuality,
  seed,
  strength,
  setStrength,
  showSizeSelector = false,
  defaultSize = "16:9",
}: SettingsSectionProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  return (
    <div className={`border-t border-gray-800/50 pt-2 pb-1 ${className}`}>
      <div className="text-[9px] uppercase text-gray-500 tracking-wide mb-1.5">{title}</div>

      {quality !== undefined && setQuality && (
        <div className="space-y-1 mb-2">
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
        </div>
      )}

      {strength !== undefined && setStrength && (
        <div className="space-y-1 mb-2">
          <div className="flex justify-between items-center">
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
        </div>
      )}

      {seed !== undefined && (
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] uppercase text-gray-500 tracking-wide">SEED</div>
          <div className="text-[9px] text-gray-400 font-mono">{seed}</div>
        </div>
      )}

      {showSizeSelector && (
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] uppercase text-gray-500 tracking-wide">SIZE</div>
          <Select defaultValue={defaultSize}>
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
              <SelectItem value="1:1" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                1:1
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {children}
    </div>
  )
}

export const SettingsSection = memo(SettingsSectionComponent)

