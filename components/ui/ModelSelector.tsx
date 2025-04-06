"use client"

import { memo, useCallback, useEffect, useState } from "react"
import { getVideoModels, getVideoModelById } from "@/lib/utils/schema-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface ModelSelectorProps {
  selectedModelId: string
  onModelChange: (modelId: string) => void
  settings: Record<string, any>
  onSettingsChange: (settings: Record<string, any>) => void
  className?: string
  data?: any
}

function ModelSelectorComponent({
  selectedModelId,
  onModelChange,
  settings,
  onSettingsChange,
  className = "",
  data,
}: ModelSelectorProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  const [models, setModels] = useState(getVideoModels())
  const [selectedModel, setSelectedModel] = useState(getVideoModelById(selectedModelId))

  useEffect(() => {
    setSelectedModel(getVideoModelById(selectedModelId) || null)
  }, [selectedModelId])

  const handleSettingChange = useCallback(
    (key: string, value: any) => {
      onSettingsChange({ ...settings, [key]: value })
    },
    [settings, onSettingsChange],
  )

  const renderSettings = useCallback(() => {
    if (!selectedModel) return null

    return Object.entries(selectedModel.settings).map(([key, setting]) => {
      if (Array.isArray(setting)) {
        return (
          <div key={key} className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">{key}</div>
            <Select
              value={String(settings[key])}
              onValueChange={(value) => handleSettingChange(key, value)}
              {...interactiveProps}
            >
              <SelectTrigger className="h-5 w-[80px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0">
                <SelectValue placeholder={String(setting[0])} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
                {setting.map((option) => (
                  <SelectItem
                    key={String(option)}
                    value={String(option)}
                    className="text-[9px] py-1 px-2 text-gray-300"
                    {...interactiveProps}
                  >
                    {String(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      } else if (typeof setting === "object" && setting.type === "integer") {
        return (
          <div key={key} className="space-y-1 pt-1">
            <div className="flex justify-between items-center">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">{key}</div>
              <div className="text-[9px] text-gray-400">{settings[key]}</div>
            </div>
            <Slider
              value={[settings[key]]}
              min={setting.min}
              max={setting.max}
              step={1}
              onValueChange={(value) => handleSettingChange(key, value[0])}
              className="w-full h-1.5"
              {...interactiveProps}
            />
          </div>
        )
      }

      return null
    })
  }, [selectedModel, settings, handleSettingChange, interactiveProps])

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-[9px] uppercase text-gray-500 tracking-wide">Model</div>
          <Select value={selectedModelId} onValueChange={onModelChange} {...interactiveProps}>
            <SelectTrigger className="h-5 w-[80px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
              {models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="text-[9px] py-1 px-2 text-gray-300"
                  {...interactiveProps}
                >
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {renderSettings()}
      </div>
    </div>
  )
}

export default memo(ModelSelectorComponent)

