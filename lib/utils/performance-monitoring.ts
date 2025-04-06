/**
 * Utility functions for monitoring performance
 */

// Tracking render counts
const renderCounts: Record<string, number> = {}

/**
 * Increment and track component renders
 * @param componentName Name of the component
 * @returns Current render count
 */
export function trackRender(componentName: string): number {
  if (!renderCounts[componentName]) {
    renderCounts[componentName] = 0
  }

  renderCounts[componentName]++
  return renderCounts[componentName]
}

/**
 * Log render counts for debugging
 */
export function logRenderCounts(): void {
  console.table(renderCounts)
}

/**
 * Reset render counts
 */
export function resetRenderCounts(): void {
  Object.keys(renderCounts).forEach((key) => {
    renderCounts[key] = 0
  })
}

// Performance timing
const perfTimers: Record<string, number> = {}

/**
 * Start timing an operation
 * @param operationName Name of the operation
 */
export function startTiming(operationName: string): void {
  perfTimers[operationName] = performance.now()
}

/**
 * End timing an operation and log the result
 * @param operationName Name of the operation
 * @returns Duration in milliseconds
 */
export function endTiming(operationName: string): number | null {
  if (!perfTimers[operationName]) {
    console.warn(`No timer started for operation: ${operationName}`)
    return null
  }

  const startTime = perfTimers[operationName]
  const endTime = performance.now()
  const duration = endTime - startTime

  // Cleanup
  delete perfTimers[operationName]

  return duration
}

/**
 * Measure component render time with a simple wrapper
 * @param name Component name for logging
 * @returns Function to call at start and end of render
 */
export function measureRender(name: string) {
  const start = performance.now()

  return () => {
    const duration = performance.now() - start
    if (duration > 5) {
      console.warn(`Slow render: ${name} took ${duration.toFixed(2)}ms`)
    }
    return duration
  }
}

