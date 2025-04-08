"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useReactFlow } from "reactflow"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { handleDragOver as utilHandleDragOver, handleDragLeave as utilHandleDragLeave } from "@/lib/utils/drag-drop"

// Create stable selectors outside of the component
// const getSavedImagesSelector = (state: any) => state.getSavedImages() // We will derive this inside the hook now
const getSavedAssetsSelector = (state: any) => state.savedAssets
const getAddAssetSelector = (state: any) => state.addAsset

// Add the SavedAsset type if it's not already imported/defined in this scope
// Assuming it's defined in the store file, we might need to import it
// For now, let's add a basic definition here if needed, 
// but ideally it should be imported from '@/store/useImageLibraryStore'
interface SavedAsset {
    id: string;
    url: string;
    type: "image" | "video";
    title: string;
    description?: string;
    settings?: Record<string, any>;
    timestamp: number;
  }

interface UseImageHandlingOptions {
  id: string
  data: any
  handleInputInteraction?: (isInteracting: boolean) => void
  onImageSelect?: (imageUrl: string) => void
  onImageUpload?: (file: File, imageUrl: string) => void
  onDragStateChange?: (isDragging: boolean) => void
  initialImageUrl?: string | null
}

/**
 * Unified hook for image handling functionality
 * Handles image selection, upload, and drag-and-drop
 */
export function useImageHandling({
  id,
  data,
  onImageSelect,
  onImageUpload,
  onDragStateChange,
  initialImageUrl,
  updateConnectedNodes = true,
  updateNodeImageUrl,
  handleInputInteraction,
}: UseImageHandlingOptions) {
  // State
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedImage, setSelectedImage] = useState(initialImageUrl || data.imageUrl || null)

  // Refs
  const dropRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the store with stable selectors
  // Select the raw assets array
  const savedAssets = useImageLibraryStore(getSavedAssetsSelector)
  const addImage = useImageLibraryStore(getAddAssetSelector)

  // Derive savedImages from savedAssets using useMemo for stability
  const savedImages = useMemo(() => savedAssets.map((asset: SavedAsset) => asset.url), [savedAssets])

  // ReactFlow
  const { setNodes } = useReactFlow()

  // Update node with image
  const updateNodeWithImage = useCallback(
    (imageUrl: string, file?: File) => {
      // Update the node data
      const updatedData = {
        ...data,
        imageUrl: imageUrl,
        ...(file ? { imageFile: file } : {}),
      }

      // Update the node in ReactFlow
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))

      // Update connected nodes if needed
      if (updateConnectedNodes && updateNodeImageUrl) {
        updateNodeImageUrl(id, imageUrl)
      }
    },
    [data, id, setNodes, updateConnectedNodes, updateNodeImageUrl],
  )

  // Process image file (used by both drop and file input)
  const processImageFile = useCallback(
    (file: File) => {
      if (!file) return

      const reader = new FileReader()

      reader.onload = () => {
        try {
          const imageUrl = reader.result as string
          if (!imageUrl) return

          // Save the image to the library
          addImage({
            url: imageUrl,
            type: "image",
            title: "Uploaded Image",
          })
          setSelectedImage(imageUrl)

          // Use the provided callback if available
          if (onImageUpload) {
            onImageUpload(file, imageUrl)
            return
          }

          // Otherwise, update the node data directly
          updateNodeWithImage(imageUrl, file)
        } catch (error) {
          console.error("Error processing image file:", error)
        }
      }

      reader.onerror = () => {
        console.error("Error reading file:", reader.error)
      }

      try {
        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Error reading file as data URL:", error)
      }
    },
    [addImage, onImageUpload, updateNodeWithImage],
  )

  // Enhanced drag over handler with state update
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const result = utilHandleDragOver(e)
      setIsDragging(true)
      onDragStateChange?.(true)
      return result
    },
    [onDragStateChange],
  )

  // Enhanced drag leave handler with state update
  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const result = utilHandleDragLeave(e)
      setIsDragging(false)
      onDragStateChange?.(false)
      return result
    },
    [onDragStateChange],
  )

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!e) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      onDragStateChange?.(false)

      try {
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0]
          if (file && file.type && file.type.startsWith("image/")) {
            processImageFile(file)
          }
        }
      } catch (error) {
        console.error("Error handling file drop:", error)
      }
    },
    [onDragStateChange, processImageFile],
  )

  // Handle click to open image selector
  const handleClick = useCallback(() => {
    // Ensure the dialog opens
    setShowImageSelector(true)
    // Notify about input interaction
    handleInputInteraction?.(true)

    // Log for debugging
    console.log("Image click handler triggered, opening selector dialog")
  }, [handleInputInteraction])

  // Handle click to open file input
  const handleOpenFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
    handleInputInteraction?.(true)
  }, [handleInputInteraction])

  // Handle image selection from library
  const selectImage = useCallback(
    (imageUrl: string) => {
      setSelectedImage(imageUrl)
      
      // Close dialog
      setShowImageSelector(false)
      
      // Update local data
      if (data) {
        data.imageUrl = imageUrl;
      }
      
      // Notify parent via callback
      if (onImageSelect) {
        onImageSelect(imageUrl);
      }
    },
    [data, setShowImageSelector, onImageSelect]
  );

  // Handle file upload from input
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          processImageFile(file)
        }
      }
      setShowImageSelector(false)
      handleInputInteraction?.(false)

      // Reset the input value so the same file can be selected again
      if (e.target) {
        e.target.value = ""
      }
    },
    [processImageFile, handleInputInteraction],
  )

  // Update selected image when data.imageUrl changes
  useEffect(() => {
    if (data.imageUrl && data.imageUrl !== selectedImage) {
      setSelectedImage(data.imageUrl)
    }
  }, [data.imageUrl, selectedImage])

  return {
    // State
    isDragging,
    showImageSelector,
    setShowImageSelector,
    selectedImage,

    // Refs
    dropRef,
    fileInputRef,

    // Data
    savedImages,
    savedAssets,

    // Actions
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleOpenFileInput,
    selectImage,
    handleFileUpload,
    processImageFile,
    updateNodeWithImage,
  }
}

