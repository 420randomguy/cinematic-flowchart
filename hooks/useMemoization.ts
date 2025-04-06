"use client"

/**
 * Simple memoization utilities for component optimization
 */

// Create a simple comparison function for NodeContent props
export function nodeContentComparison(prevProps: any, nextProps: any) {
  // Fast path: reference equality
  if (prevProps === nextProps) return true

  // Null/undefined check
  if (!prevProps || !nextProps) return prevProps === nextProps

  // Compare only the props that affect rendering
  return (
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.isGenerated === nextProps.isGenerated &&
    prevProps.showVideo === nextProps.showVideo &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.data?.category === nextProps.data?.category &&
    prevProps.data?.caption === nextProps.data?.caption
  )
}

// Create a simple comparison function for NodeSettings props
export function nodeSettingsComparison(prevProps: any, nextProps: any) {
  // Null/undefined check
  if (!prevProps || !nextProps) return prevProps === nextProps

  // Simple comparison of essential props
  return (
    prevProps.quality === nextProps.quality &&
    prevProps.seed === nextProps.seed &&
    prevProps.strength === nextProps.strength &&
    prevProps.selectedModelId === nextProps.selectedModelId &&
    JSON.stringify(prevProps.modelSettings || {}) === JSON.stringify(nextProps.modelSettings || {})
  )
}

// Export a hook that returns all comparison functions
export function useMemoization() {
  return {
    nodeContentComparison,
    nodeSettingsComparison,
  }
}

// Safe JSON stringify that handles circular references
export function safeStringify(obj: any): string {
  try {
    const seen = new WeakSet()
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]"
        }
        seen.add(value)
      }
      return value
    })
  } catch (err) {
    return String(obj)
  }
}

// Generic deep comparison function
export function deepCompare(a: any, b: any): boolean {
  // Handle primitive types and reference equality
  if (a === b) return true

  // Handle null/undefined
  if (a == null || b == null) return a === b

  // Handle different types
  if (typeof a !== typeof b) return false

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepCompare(a[i], b[i])) return false
    }
    return true
  }

  // Handle objects
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!deepCompare(a[key], b[key])) return false
    }

    return true
  }

  return false
}

