"use client"

import type React from "react"
import { createContext, useState, useEffect, useCallback } from "react"

interface ImageLibraryContextType {
  savedImages: string[]
  addImage: (imageUrl: string) => void
  removeImage: (imageUrl: string) => void
}

// Create context with default values
export const ImageLibraryContext = createContext<ImageLibraryContextType>({
  savedImages: [],
  addImage: () => {},
  removeImage: () => {},
})

export const ImageLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [savedImages, setSavedImages] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedImages")
      return saved ? JSON.parse(saved) : ["/sample-image.png"]
    }
    return ["/sample-image.png"]
  })

  // Save to localStorage whenever savedImages changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("savedImages", JSON.stringify(savedImages))
    }
  }, [savedImages])

  // Add a new image to the library
  const addImage = useCallback((imageUrl: string) => {
    setSavedImages((prev) => {
      // Don't add duplicates
      if (prev.includes(imageUrl)) return prev
      return [...prev, imageUrl]
    })
  }, [])

  // Remove an image from the library
  const removeImage = useCallback((imageUrl: string) => {
    setSavedImages((prev) => prev.filter((img) => img !== imageUrl))
  }, [])

  return (
    <ImageLibraryContext.Provider value={{ savedImages, addImage, removeImage }}>
      {children}
    </ImageLibraryContext.Provider>
  )
}

