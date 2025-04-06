/**
 * DOM Manipulation Optimization Utilities
 *
 * This file contains utilities for optimizing DOM manipulations
 * to reduce layout thrashing and improve rendering performance.
 */

/**
 * Schedule a DOM read operation to be performed before the next repaint
 * This prevents layout thrashing by batching read operations
 */
export function scheduleDOMRead<T>(callback: () => T): Promise<T | null> {
  return new Promise((resolve) => {
    // Use requestAnimationFrame to schedule the read before the next repaint
    requestAnimationFrame(() => {
      try {
        const result = callback()
        resolve(result)
      } catch (error) {
        console.warn("Error in scheduleDOMRead:", error)
        resolve(null)
      }
    })
  })
}

/**
 * Schedule a DOM write operation to be performed before the next repaint
 * This prevents layout thrashing by batching write operations
 */
export function scheduleDOMWrite(callback: () => void): Promise<void> {
  return new Promise((resolve) => {
    // Use requestAnimationFrame to schedule the write before the next repaint
    requestAnimationFrame(() => {
      callback()
      resolve()
    })
  })
}

/**
 * Batch multiple DOM read operations together
 * This prevents layout thrashing by avoiding interleaved reads and writes
 */
export function batchDOMReads<T>(callbacks: Array<() => T>): Promise<T[]> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const results = callbacks.map((callback) => callback())
      resolve(results)
    })
  })
}

/**
 * Batch multiple DOM write operations together
 * This prevents layout thrashing by avoiding interleaved reads and writes
 */
export function batchDOMWrites(callbacks: Array<() => void>): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      callbacks.forEach((callback) => callback())
      resolve()
    })
  })
}

/**
 * Perform a read-then-write DOM operation efficiently
 * This prevents layout thrashing by ensuring reads happen before writes
 */
export function readThenWrite<T, U>(readCallback: () => T, writeCallback: (readResult: T) => U): Promise<U | null> {
  return new Promise((resolve) => {
    // First schedule a read
    scheduleDOMRead(readCallback).then((readResult) => {
      // Skip the write if read result is null
      if (readResult === null) {
        resolve(null)
        return
      }

      // Then schedule a write with the read result
      requestAnimationFrame(() => {
        try {
          const writeResult = writeCallback(readResult)
          resolve(writeResult)
        } catch (error) {
          console.warn("Error in readThenWrite:", error)
          resolve(null)
        }
      })
    })
  })
}

/**
 * Create a passive event listener
 * Passive listeners don't block scrolling, improving performance
 */
export function createPassiveEventListener<K extends keyof WindowEventMap>(
  element: Window | Document | HTMLElement,
  eventType: K,
  callback: (event: WindowEventMap[K]) => void,
  options: AddEventListenerOptions = { passive: true },
): () => void {
  element.addEventListener(eventType, callback as EventListener, options)

  // Return a cleanup function
  return () => {
    element.removeEventListener(eventType, callback as EventListener, options)
  }
}

/**
 * Measure an element's dimensions and position efficiently
 */
export function measureElement(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect()
}

/**
 * Apply styles to an element efficiently
 * This batches style changes to prevent multiple reflows
 */
export function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  scheduleDOMWrite(() => {
    Object.entries(styles).forEach(([property, value]) => {
      // @ts-ignore - We're using string indexing on CSSStyleDeclaration
      element.style[property] = value
    })
  })
}

/**
 * Create a ResizeObserver with performance optimizations
 */
export function createOptimizedResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  throttleMs = 100,
): ResizeObserver {
  let timeout: number | null = null
  let entries: ResizeObserverEntry[] = []

  const throttledCallback = (newEntries: ResizeObserverEntry[]) => {
    // Skip if no entries
    if (newEntries.length === 0) return

    // Collect all entries that come in during the throttle period
    entries = [...entries, ...newEntries]

    if (timeout === null) {
      timeout = window.setTimeout(() => {
        // Process all collected entries at once
        scheduleDOMRead(() => {
          try {
            callback(entries)
          } catch (error) {
            console.warn("Error in ResizeObserver callback:", error)
          }
          entries = []
          timeout = null
        })
      }, throttleMs)
    }
  }

  return new ResizeObserver(throttledCallback)
}

