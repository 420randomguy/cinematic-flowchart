import type React from "react"
import type { ReactNode } from "react"

// Node Types
export type NodeCategory = "text" | "image" | "video" | "image-to-video" | "text-to-video" | "image-to-image"

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

export interface TextNodeData extends BaseNodeData {
  content: string
  sourceNodeContent?: string
}

export interface ImageToImageNodeData extends BaseNodeData {
  imageFile?: File
  outputImageUrl?: string
  strength?: number
}

export interface NodeContentProps {
  data: any
  isSubmitting: boolean
  isGenerated: boolean
  showVideo?: boolean
  imageUrl?: string | null
  textContent?: string
  isDragging?: boolean
  dropRef?: React.RefObject<HTMLDivElement>
  handleDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  handleClick?: () => void
  children?: ReactNode
}

export interface NodeHeaderProps {
  title: string
  type: string
  modelId?: string
  onModelChange?: (modelId: string) => void
  className?: string
}

// Update SubmitButtonProps to ensure consistency
export interface SubmitButtonProps {
  isSubmitting: boolean
  isGenerated: boolean
  onClick: () => void
  timeRemaining?: number
  disabled?: boolean
  handleInputInteraction?: (isInteracting?: boolean) => void
}

export interface InteractiveElementProps {
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export interface InputElementProps extends InteractiveElementProps {
  onCopy: (e: React.ClipboardEvent) => void
  onCut: (e: React.ClipboardEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
}

export interface NodeSettingsProps {
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

export interface NodeActionsProps {
  imageUrl?: string | null
  showVideo?: boolean
  className?: string
}

export interface BaseNodeProps {
  id: string
  data: any
  nodeType: string
  title: string
  showSourceHandle?: boolean
  showTargetHandle?: boolean
  targetHandleIds?: string[]
  isConnectable?: boolean
  modelId?: string
  onModelChange?: (modelId: string) => void
  contentProps?: any
  settingsProps?: any
  actionsProps?: any
  children?: ReactNode
}

export interface AnalysisNodeData extends BaseNodeData {
  content: string
  sourceNodeContent?: string
}

