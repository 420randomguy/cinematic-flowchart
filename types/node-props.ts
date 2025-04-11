import type React from "react"
import type { ReactNode } from "react"

/**
 * Base props shared by all node components
 */
export interface BaseNodeProps {
  id: string
  data: any
  isConnectable?: boolean
  selected?: boolean
}

/**
 * Props for node wrapper component
 */
export interface NodeWrapperProps {
  id: string
  type: string
  isNewNode?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
  dataNodeId?: string
}

/**
 * Props for node header component
 */
export interface NodeHeaderProps {
  title: string
  type: string
  modelId?: string
  onModelChange?: (modelId: string) => void
  className?: string
}

/**
 * Props for node content component
 */
export interface NodeContentProps {
  // Core props
  data: any
  id?: string
  className?: string
  children?: ReactNode

  // State props
  isSubmitting?: boolean
  isGenerated?: boolean

  // Content props
  showVideo?: boolean
  imageUrl?: string | null
  textContent?: string
  category?: string

  // Drag and drop props
  isDragging?: boolean
  handleDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  handleDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  handleClick?: () => void
}

/**
 * Props for node settings component
 */
export interface NodeSettingsProps {
  // Quality settings
  quality: number
  setQuality: (quality: number) => void

  // Seed settings
  seed: string | number

  // Strength settings (for image-to-image)
  strength?: number
  setStrength?: (strength: number) => void

  // Model settings
  selectedModelId?: string
  modelSettings?: Record<string, any>
  handleModelChange?: (modelId: string) => void
  handleSettingsChange?: (settings: Record<string, any>) => void

  // Additional props
  data?: any
  showSizeSelector?: boolean
  defaultSize?: string
  content?: string
  className?: string
}

/**
 * Props for node actions component
 */
export interface NodeActionsProps {
  imageUrl?: string | null
  showVideo?: boolean
  className?: string
  nodeId?: string
}

/**
 * Props for submit button component
 */
export interface SubmitButtonProps {
  isSubmitting?: boolean
  isGenerated?: boolean
  onClick?: () => void
  timeRemaining?: number
  disabled?: boolean
  handleInputInteraction?: (isInteracting?: boolean) => void
  nodeId?: string
}

/**
 * Props for text preview component
 */
export interface TextPreviewProps {
  text?: string
  nodeId?: string
  maxLength?: number
  className?: string
  showIfEmpty?: boolean
  emptyText?: string
  isConnected?: boolean
}

/**
 * Props for node handle component
 */
export interface NodeHandleProps {
  type: "source" | "target"
  position: any // Use the actual Position type from ReactFlow
  id?: string
  isConnectable?: boolean
  style?: React.CSSProperties
  className?: string
}

/**
 * Props for image selector dialog
 */
export interface ImageSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  savedImages: string[]
  onSelectImage: (imageUrl: string) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleInputInteraction: (isInteracting?: boolean) => void
}

