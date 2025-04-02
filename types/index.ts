import type { ReactNode } from "react"

// Node Types
export type NodeCategory = "text" | "image" | "video" | "image-to-image"

export interface BaseNodeData {
  title: string
  showImage?: boolean
  category: NodeCategory
  content?: string
  seed?: string
  caption?: string
  isNewNode?: boolean
  autoSubmit?: boolean
  imageUrl?: string
  sourceNodeContent?: string
  onImageUpload?: (file: File, string: any) => void
  onImageSelect?: (imageUrl: string) => void
}

export interface ImageNodeData extends BaseNodeData {
  imageFile?: File
  textNodeId?: string
  quality?: number
  seed?: number
  model?: string
}

export interface VideoNodeData extends BaseNodeData {
  videoUrl?: string
  textNodeId?: string
  imageNodeId?: string
  quality?: number
  seed?: number
  modelId?: string
  modelSettings?: Record<string, any>
  onModelChange?: (modelId: string, settings: Record<string, any>) => void
}

export interface AnalysisNodeData extends BaseNodeData {}

export interface ImageToImageNodeData extends BaseNodeData {
  imageFile?: File
  outputImageUrl?: string
  strength?: number
}

export interface NodeContentProps {
  data: any
  isSubmitting: boolean
  isGenerated: boolean
  showVideo: boolean
  children: ReactNode
}

export interface NodeHeaderProps {
  title: string
  type: string
  modelId?: string
  onModelChange?: (modelId: string) => void
}

export interface SubmitButtonProps {
  isSubmitting: boolean
  isGenerated: boolean
  onClick: () => void
  timeRemaining?: number
}

