"use client"

import type React from "react"

import { useState, useCallback, useRef, useContext } from "react"
import { useReactFlow } from "reactflow"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"

interface UseImageSelectionProps {
  id: string
  data: any
}

export function useImageSelection({ id, data }: UseImageSelectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { savedImages, addImage } = useContext(ImageLibraryContext)
  const { setNodes } = useReactFlow()

  // Handle image upload from drag and drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result as string

            // Save the image to the library
            addImage(imageUrl)

            // Update the node data
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [data, id, setNodes, addImage],
  )

  const handleClick = useCallback(() => {
    setShowImageSelector(true)
  }, [])

  const selectImage = useCallback(
    (imageUrl: string) => {
      // Update the node data with the selected image
      const updatedData = {
        ...data,
        imageUrl: imageUrl,
      }

      // Update the node in ReactFlow
      setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
      setShowImageSelector(false)
    },
    [data, id, setNodes],
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result as string

            // Save the image to the library
            addImage(imageUrl)

            // Update the node data
            const updatedData = {
              ...data,
              imageUrl: imageUrl,
              imageFile: file,
            }

            // Update the node in ReactFlow
            setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: updatedData } : node)))
          }
          reader.readAsDataURL(file)
        }
      }
      setShowImageSelector(false)
    },
    [data, id, setNodes, addImage],
  )

  return {
    isDragging,
    showImageSelector,
    setShowImageSelector,
    dropRef,
    savedImages,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    selectImage,
    handleFileUpload,
  }
}

