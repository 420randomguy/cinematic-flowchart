// Node Types
export type NodeCategory =
  | "text"
  | "image"
  | "video"
  | "image-to-video"
  | "text-to-video"
  | "image-to-image"
  | "text-to-image"

export interface BaseNodeData {
  title: string
  showImage?: boolean
  category: NodeCategory
  content?: string
  seed?: string | number
  caption?: string
  isNewNode?: boolean
  autoSubmit?: boolean
  imageUrl?: string
  onImageUpload?: (file: File, string: any) => void
  onImageSelect?: (imageUrl: string) => void
  _hasInitializedConnections?: boolean
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
  sourceImageUrl?: string
}

export interface TextNodeData extends BaseNodeData {
  content: string
}

export interface ImageToImageNodeData extends BaseNodeData {
  imageFile?: File
  outputImageUrl?: string
  strength?: number
  sourceImageUrl?: string
}

export interface AnalysisNodeData extends BaseNodeData {
  content: string
}

