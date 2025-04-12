"use client"

/**
 * Utility functions for handling node interactions
 */

import type React from "react"

/**
 * Prevent node drag for interactive elements
 * @param e Event object
 */
export function preventNodeDrag(e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) {
  // Stop propagation to prevent the event from triggering node drag
  e.stopPropagation()
  
  // Stop immediate propagation if available
  if ("nativeEvent" in e) {
    e.nativeEvent.stopImmediatePropagation()
  }
}

/**
 * Creates props for interactive elements within nodes
 * This ensures consistent handling of events across all node components
 * @param handleInputInteraction Function to handle input interaction
 * @returns Props object for interactive elements
 */
export function createInteractiveProps(handleInputInteraction: (isInteracting?: boolean) => void) {
  return {
    // Control when nodes should be draggable
    onFocus: () => handleInputInteraction(true),
    onBlur: () => handleInputInteraction(false),
    onMouseEnter: () => handleInputInteraction(true),
    onMouseLeave: () => handleInputInteraction(false),
    
    // Prevent node drag when interacting with the element
    onMouseDown: (e: React.MouseEvent) => preventNodeDrag(e),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
  }
}

/**
 * Creates props specifically for form inputs within nodes
 * Extends interactive props with copy/paste event handling
 * @param handleInputInteraction Function to handle input interaction
 * @returns Props object for form inputs
 */
export function createInputProps(handleInputInteraction: (isInteracting?: boolean) => void) {
  return {
    ...createInteractiveProps(handleInputInteraction),
    onCopy: (e: React.ClipboardEvent) => e.stopPropagation(),
    onCut: (e: React.ClipboardEvent) => e.stopPropagation(),
    onPaste: (e: React.ClipboardEvent) => e.stopPropagation(),
  }
}

/**
 * Creates a standardized event handler that prevents propagation
 * Useful for buttons and interactive elements within nodes
 * @param handler Event handler function
 * @returns Wrapped event handler function
 */
export function createNodeEventHandler<T extends React.SyntheticEvent>(handler?: (e: T) => void): (e: T) => void {
  return (e: T) => {
    e.stopPropagation()
    handler?.(e)
  }
}

