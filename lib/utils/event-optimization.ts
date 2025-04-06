/**
 * Optimized event handling utilities
 */

// Shared throttle/debounce implementation to reduce code size
type ThrottleDebounceOptions = {
  leading?: boolean
  trailing?: boolean
}

/**
 * Creates a function that limits how often the original function can be called
 */
function createLimitedFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleDebounceOptions & { isThrottle: boolean },
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let previous = 0
  let result: ReturnType<T> | undefined
  let pending = false

  const { leading = true, trailing = true, isThrottle } = options

  return function executedFunction(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now()
    const remaining = wait - (now - previous)

    // For throttle with leading edge, execute immediately if first call
    if (isThrottle && !previous && leading) {
      previous = now
      result = func(...args)
      return result
    }

    // For debounce with leading edge, execute immediately if not pending
    if (!isThrottle && !pending && leading) {
      result = func(...args)
      pending = true
      setTimeout(() => {
        pending = false
      }, wait)
      return result
    }

    // Clear existing timeout for trailing edge
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }

    // For throttle, update previous time if time elapsed
    if (isThrottle && remaining <= 0) {
      previous = now
      result = func(...args)
      return result
    }

    // Set timeout for trailing edge
    if (trailing) {
      timeout = setTimeout(
        () => {
          previous = isThrottle ? now : 0
          timeout = null
          pending = false
          result = func(...args)
        },
        isThrottle ? remaining : wait,
      )
    }

    return result
  }
}

/**
 * Creates a throttled function that only invokes func at most once per wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait = 100,
  options: ThrottleDebounceOptions = {},
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return createLimitedFunction(func, wait, { ...options, isThrottle: true })
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 100,
  options: ThrottleDebounceOptions = {},
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return createLimitedFunction(func, wait, { ...options, isThrottle: false })
}

/**
 * Batches multiple function calls into a single execution
 */
export function batch<T extends (...args: any[]) => any>(
  func: T,
  wait = 16, // Default to roughly one frame
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let batched: Parameters<T>[] = []

  return function batchedFunction(...args: Parameters<T>): void {
    batched.push(args)

    if (!timeout) {
      timeout = setTimeout(() => {
        const args = batched
        batched = []
        timeout = null
        func(...args[args.length - 1]) // Execute with latest args
      }, wait)
    }
  }
}

/**
 * Creates a memoized version of a function that caches the result
 */
export function memoize<T extends (...args: any[]) => any>(func: T, resolver?: (...args: Parameters<T>) => string): T {
  const cache = new Map<string, ReturnType<T>>()

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  } as T
}

/**
 * Prevents event propagation and default behavior
 */
export function stopEvent(e: Event): void {
  e.preventDefault()
  e.stopPropagation()
  if ("nativeEvent" in e) {
    ;(e as any).nativeEvent.stopImmediatePropagation()
  }
} 