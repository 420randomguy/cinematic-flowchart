/**
 * Utility functions for handling node interactions
 * These functions help prevent event propagation and manage input interactions
 */

import type React from "react"

/**
 * Prevents event propagation for node interactions
 * This is critical for allowing inputs to work properly within nodes
 */
export function preventNodeDrag(e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent) {
  e.stopPropagation()
  if ("nativeEvent" in e) {
    e.nativeEvent.stopImmediatePropagation()
  }
}

/**
 * Creates props for interactive elements within nodes
 * This ensures consistent handling of events across all node components
 */
export function createInteractiveProps(handleInputInteraction: (isInteracting?: boolean) => void) {
  return {
    onMouseEnter: () => handleInputInteraction(true),
    onMouseLeave: () => handleInputInteraction(false),
    onFocus: () => handleInputInteraction(true),
    onBlur: () => handleInputInteraction(false),
    onMouseDown: (e: React.MouseEvent) => {
      preventNodeDrag(e)
      // Don't stop propagation for click events
      // This allows click handlers to work properly
    },
    onClick: (e: React.MouseEvent) => {
      // Only stop propagation, don't prevent default
      // This allows click handlers to work properly
      e.stopPropagation()
    },
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseMove: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseUp: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  }
}

/**
 * Creates props specifically for form inputs within nodes
 * Extends interactive props with copy/paste event handling
 */
export function createInputProps(handleInputInteraction: (isInteracting?: boolean) => void) {
  return {
    ...createInteractiveProps(handleInputInteraction),
    onCopy: (e: React.ClipboardEvent) => e.stopPropagation(),
    onCut: (e: React.ClipboardEvent) => e.stopPropagation(),
    onPaste: (e: React.ClipboardEvent) => e.stopPropagation(),
  }
}

