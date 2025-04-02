"use client"

import { useState, useEffect, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { getVideoModels, getVideoModelById, getDefaultSettings, type VideoModel } from "@/lib/utils/schema-loader"

interface ModelSelectorProps {
  selectedModelId: string
  onModelChange: (modelId: string) => void
  settings: Record<string, any>
  onSettingsChange: (settings: Record<string, any>) => void
  className?: string
  data?: {
    content?: string
    caption?: string
  }
}

export default function ModelSelector({
  selectedModelId,
  onModelChange,
  settings,
  onSettingsChange,
  className = "",
  data,
}: ModelSelectorProps) {
  const [models, setModels] = useState<VideoModel[]>([])
  const [selectedModel, setSelectedModel] = useState<VideoModel | null>(null)
  const initialRenderRef = useRef(true)
  const prevModelIdRef = useRef(selectedModelId)

  // Load models on mount
  useEffect(() => {
    const availableModels = getVideoModels()
    setModels(availableModels)
  }, [])

  // Update selected model when ID changes
  useEffect(() => {
    const model = getVideoModelById(selectedModelId)
    setSelectedModel(model || null)

    // Skip settings update on initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    // Only update settings if model has changed
    if (model && prevModelIdRef.current !== selectedModelId) {
      prevModelIdRef.current = selectedModelId

      // Get default settings for the new model
      const defaultSettings = getDefaultSettings(selectedModelId)
      onSettingsChange(defaultSettings)
    }
  }, [selectedModelId, onSettingsChange])

  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  // Render settings based on model schema
  const renderSettings = () => {
    if (!selectedModel) return null

    return Object.entries(selectedModel.settings).map(([key, setting]) => {
      // For array settings (enum types)
      if (Array.isArray(setting)) {
        // Special case for boolean settings
        if (setting.length === 2 && typeof setting[0] === "boolean") {
          return (
            <div key={key} className="flex items-center justify-between pt-1">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">{key.replace(/_/g, " ")}</div>
              <Switch
                checked={settings[key] === true}
                onCheckedChange={(checked) => handleSettingChange(key, checked)}
                className="data-[state=checked]:bg-gray-600"
              />
            </div>
          )
        }

        // For string enum settings
        return (
          <div key={key} className="flex justify-between items-center pt-1">
            <div className="text-[9px] uppercase text-gray-500 tracking-wide">{key.replace(/_/g, " ")}</div>
            <Select
              value={String(settings[key] || setting[0])}
              onValueChange={(value) => handleSettingChange(key, value)}
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
                  >
                    {String(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
      // For integer settings
      else if (typeof setting === "object" && setting.type === "integer") {
        return (
          <div key={key} className="space-y-1 pt-1">
            <div className="flex justify-between items-center">
              <div className="text-[9px] uppercase text-gray-500 tracking-wide">{key.replace(/_/g, " ")}</div>
              <div className="text-[9px] text-gray-400">{settings[key] || setting.default}</div>
            </div>
            <Slider
              value={[settings[key] || setting.default]}
              min={setting.min}
              max={setting.max}
              step={1}
              onValueChange={(value) => handleSettingChange(key, value[0])}
              className="w-full h-1.5"
            />
          </div>
        )
      }

      return null
    })
  }

  return (
    <div className={className}>
      {data?.content && (
        <div className="text-[9px] text-gray-300 mb-3 font-mono tracking-wide border-b border-gray-800/50 pb-2 line-clamp-2">
          {typeof data.content === "string"
            ? data.content.substring(0, 100) + (data.content.length > 100 ? "..." : "")
            : ""}
        </div>
      )}

      <div className="space-y-2">{renderSettings()}</div>
    </div>
  )
}

