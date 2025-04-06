/**
 * Utility functions for drag and drop operations
 */

import type React from "react"

/**
 * Standard handler for drag over events
 * Prevents default behavior and sets the drop effect
 * @param e Drag event
 * @returns True to indicate the event was handled
 */
export function handleDragOver(e: React.DragEvent<HTMLElement>) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = "copy"
  return true
}

/**
 * Standard handler for drag leave events
 * Prevents default behavior
 * @param e Drag event
 * @returns True to indicate the event was handled
 */
export function handleDragLeave(e: React.DragEvent<HTMLElement>) {
  e.preventDefault()
  e.stopPropagation()
  return true
}

/**
 * Creates a data transfer object for node dragging
 * @param nodeType Node type
 * @param data Node data
 * @returns Stringified data transfer object
 */
export function createNodeDragData(nodeType: string, data: any) {
  return JSON.stringify({
    type: nodeType,
    data: {
      ...data,
      isNewNode: true,
    },
  })
}

/**
 * Parses data transfer object from a drop event
 * @param e Drag event
 * @returns Parsed data or null if invalid
 */
export function parseDropData(e: React.DragEvent<HTMLElement>) {
  try {
    const data = e.dataTransfer.getData("application/reactflow")
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error("Error parsing drag data:", error)
  }
  return null
}

/**
 * Creates a drag handler for node dragging
 * @param nodeType Node type
 * @param data Node data
 * @returns Drag handler function
 */
export function createDragHandler(nodeType: string, data: any) {
  return (e: React.DragEvent<HTMLElement>) => {
    e.dataTransfer.setData("application/reactflow", createNodeDragData(nodeType, data))
    e.dataTransfer.effectAllowed = "move"
  }
}

/**
 * Creates a drop handler for node dropping
 * @param onDrop Function to handle drop
 * @returns Drop handler function
 */
export function createDropHandler(onDrop: (type: string, data: any, position: { x: number; y: number }) => void) {
  return (e: React.DragEvent<HTMLElement>, canvasBounds: DOMRect) => {
    e.preventDefault()
    e.stopPropagation()

    const data = parseDropData(e)
    if (data) {
      const position = {
        x: e.clientX - canvasBounds.left,
        y: e.clientY - canvasBounds.top,
      }
      onDrop(data.type, data.data, position)
    }
  }
}

