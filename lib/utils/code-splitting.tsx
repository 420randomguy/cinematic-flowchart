import React, { lazy, Suspense } from "react"

// Default loading component
const DefaultLoading = () => (
  <div className="flex items-center justify-center p-4 h-full w-full">
    <div className="animate-pulse bg-gray-800 rounded-md h-8 w-24"></div>
  </div>
)

/**
 * Creates a lazy-loaded component with a custom loading fallback
 * @param importFn Function that imports the component
 * @param LoadingComponent Custom loading component
 * @returns Lazy-loaded component wrapped in Suspense
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoading,
) {
  const LazyComponent = lazy(importFn)

  // Store the import function for preloading
  const Component = (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  )

  // Attach the import function to the component for preloading
  Component.preload = () => {
    try {
      importFn().catch(() => {
        // Silently catch errors during preloading
      })
    } catch (e) {
      // Silently catch errors
    }
  }

  return Component
}

/**
 * Creates a lazy-loaded component with a custom loading fallback
 * and preloads it when the browser is idle
 * @param importFn Function that imports the component
 * @param LoadingComponent Custom loading component
 * @returns Lazy-loaded component wrapped in Suspense
 */
export function createPreloadedLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoading,
) {
  // Preload the component when the browser is idle
  if (typeof window !== "undefined") {
    const preload = () => {
      try {
        importFn().catch(() => {
          // Silently catch errors during preloading
        })
      } catch (e) {
        // Silently catch errors
      }
    }

    if ("requestIdleCallback" in window) {
      ;(window as any).requestIdleCallback(preload, { timeout: 2000 })
    } else {
      setTimeout(preload, 1000)
    }
  }

  return createLazyComponent(importFn, LoadingComponent)
} 