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
  // Check if the target is an input element
  const target = e.target as HTMLElement
  const isInputElement =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.classList.contains("prevent-node-drag")

  // Always stop propagation
  e.stopPropagation()

  // Only prevent default for non-input elements
  if (!isInputElement && "preventDefault" in e) {
    e.preventDefault()
  }

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
    onMouseEnter: () => handleInputInteraction(true),
    onMouseLeave: () => handleInputInteraction(false),
    onFocus: () => handleInputInteraction(true),
    onBlur: () => handleInputInteraction(false),
    onMouseDown: (e: React.MouseEvent) => {
      preventNodeDrag(e)
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

