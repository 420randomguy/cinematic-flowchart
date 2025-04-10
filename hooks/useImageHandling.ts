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
  const savedAssets = useImageLibraryStore(getSavedAssetsSelector)
  const addImage = useImageLibraryStore(getAddAssetSelector)

  // Derive savedImages from savedAssets using useMemo for stability
  const savedImages = useMemo(() => savedAssets.map((asset: SavedAsset) => asset.url), [savedAssets])

  // ReactFlow
  const { setNodes, getEdges } = useReactFlow()

  // Central function to update state, call callbacks, BUT NOT dispatch event
  const finalizeImageUpdate = useCallback((imageUrl: string, file?: File) => {
    console.log("[useImageHandling] finalizeImageUpdate called with:", imageUrl);
    
    // 1. Update local hook state
    setSelectedImage(imageUrl);
    console.log("[useImageHandling] setSelectedImage called with:", imageUrl);

    // 2. Update the node data directly in React Flow state
    setNodes((nodes) => {
      console.log("[useImageHandling] Updating node in ReactFlow:", id);
      return nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, imageUrl, ...(file && { imageFile: file }) } }
          : node
      );
    });

    // 3. Find target nodes (Keep for potential store-based propagation if needed later)
    const currentEdges = getEdges();
    const targetNodeIds = currentEdges
      .filter(edge => edge.source === id && edge.sourceHandle === 'output') // Use 'output' handle as defined for ImageNode source
      .map(edge => edge.target);

    // 4. Call the original callback passed from ImageNode (which now only calls the store's updateNodeImage)
    if (onImageSelect) {
      console.log("[useImageHandling] Calling onImageSelect with:", imageUrl);
      onImageSelect(imageUrl); // This now triggers the store update for persistence
    } else {
      console.log("[useImageHandling] No onImageSelect callback provided");
    }

    // Also call onImageUpload if it was provided and a file was processed
    if (file && onImageUpload) {
      onImageUpload(file, imageUrl);
    }

  }, [id, setNodes, getEdges, onImageSelect, onImageUpload]);

  // Process image file (used by both drop and file input)
  const processImageFile = useCallback(
    (file: File) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imageUrl = reader.result as string;
          if (!imageUrl) return;
          // Save to library (optional, keep if needed)
           addImage({ url: imageUrl, type: "image", title: "Uploaded Image" }); // Assuming addImage is defined elsewhere
          // Finalize the update
          finalizeImageUpdate(imageUrl, file); // Use central function
        } catch (error) { console.error("Error processing image file:", error); }
      };
      reader.onerror = () => { console.error("Error reading file:", reader.error); };
      try { reader.readAsDataURL(file); } catch (error) { console.error("Error reading file as data URL:", error); }
    },
    [addImage, finalizeImageUpdate], // Updated dependencies
  );

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
      if (!e) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onDragStateChange?.(false);

      try {
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file && file.type && file.type.startsWith("image/")) {
            processImageFile(file); // Use the processing function
          }
        }
      } catch (error) { console.error("Error handling file drop:", error); }
    },
    [onDragStateChange, processImageFile], // processImageFile includes finalizeImageUpdate
  );

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
      console.log("[useImageHandling] selectImage called with:", imageUrl);
      
      // Finalize the update using the central function FIRST
      console.log("[useImageHandling] About to call finalizeImageUpdate");
      finalizeImageUpdate(imageUrl); // Use central function
      
      // Close dialog AFTER image update is started
      setShowImageSelector(false);
      
      console.log("[useImageHandling] Image should be updated now");
      handleInputInteraction?.(false); // Indicate interaction ended
    },
    [setShowImageSelector, finalizeImageUpdate, handleInputInteraction] // Updated dependencies
  );

  // Handle file upload from input
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const imageUrl = reader.result as string;
              if (!imageUrl) return;
              
              // Save to library
              addImage({ url: imageUrl, type: "image", title: "Uploaded Image" });
              
              // Directly apply the image to the node (instead of just processing it)
              console.log("[useImageHandling] Uploading and auto-selecting image");
              finalizeImageUpdate(imageUrl, file);
              
              // Close the dialog after selection
              setShowImageSelector(false);
              handleInputInteraction?.(false);
            } catch (error) { 
              console.error("Error processing uploaded file:", error); 
            }
          };
          reader.onerror = () => { console.error("Error reading file:", reader.error); };
          try { 
            reader.readAsDataURL(file); 
          } catch (error) { 
            console.error("Error reading file as data URL:", error); 
          }
        }
      } else {
        // Close dialog if no files were selected
        setShowImageSelector(false);
        handleInputInteraction?.(false);
      }
      
      // Reset the file input
      if (e.target) { e.target.value = ""; }
    },
    [addImage, finalizeImageUpdate, handleInputInteraction, setShowImageSelector]
  );

  // Effect to update local state if initial data changes (e.g., undo/redo)
  useEffect(() => {
    const currentImageUrl = data.imageUrl;
    if (currentImageUrl && currentImageUrl !== selectedImage) {
        // Update local state but DON'T trigger events/callbacks here
        // This reflects external changes, not user actions within this node
        setSelectedImage(currentImageUrl);
    }
  }, [data.imageUrl, selectedImage]); // Only depend on external data change

  return {
    // State
    isDragging,
    showImageSelector,
    setShowImageSelector,
    selectedImage, // Return the local state for potential display if needed
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
    // updateNodeWithImage is now effectively replaced by finalizeImageUpdate internally
  }
}


