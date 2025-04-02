/**
 * Schema loader utility for dynamically loading and parsing schema files
 */

import imageToVideoSchema from "../schemas/image_to_video_models.schema.json"

export type IntegerSetting = {
  type: "integer"
  min: number
  max: number
  default: number
}

export type EnumSetting = string[] | boolean[]

export type ModelSetting = IntegerSetting | EnumSetting

export type ModelSettings = {
  [key: string]: ModelSetting
}

export type VideoModel = {
  name: string
  id: string
  api_documentation: string
  description: string
  settings: ModelSettings
}

/**
 * Get all available video models from the schema
 */
export function getVideoModels(): VideoModel[] {
  return imageToVideoSchema.models
}

/**
 * Get a specific video model by ID
 */
export function getVideoModelById(id: string): VideoModel | undefined {
  return imageToVideoSchema.models.find((model) => model.id === id)
}

/**
 * Get default settings for a specific model
 */
export function getDefaultSettings(modelId: string): Record<string, any> {
  const model = getVideoModelById(modelId)
  if (!model) return {}

  const defaultSettings: Record<string, any> = {}

  Object.entries(model.settings).forEach(([key, setting]) => {
    if (Array.isArray(setting)) {
      // For enum settings, use the first value as default
      defaultSettings[key] = setting[0]
    } else if (typeof setting === "object" && setting.type === "integer") {
      // For integer settings, use the default value
      defaultSettings[key] = setting.default
    }
  })

  return defaultSettings
}

