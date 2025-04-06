/**
 * Utility functions for optimizing state updates
 * These functions help reduce unnecessary renders and state changes
 */

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified interval
 * @param func Function to throttle
 * @param limit Interval in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * Performs a shallow equality check between two objects
 * @param obj1 First object
 * @param obj2 Second object
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  if (!obj1 || !obj2) return false

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }

  return true
}

/**
 * Creates a batched state updater that groups multiple state updates together
 * and applies them in the next microtask
 * @param updateFn Function to handle the batched updates
 */
export function createBatchedUpdater<T>(updateFn: (updates: T[]) => void): (update: T) => void {
  let updates: T[] = []
  let scheduled = false

  return (update: T) => {
    updates.push(update)

    if (!scheduled) {
      scheduled = true
      Promise.resolve().then(() => {
        const batchedUpdates = [...updates]
        updates = []
        scheduled = false
        updateFn(batchedUpdates)
      })
    }
  }
}

/**
 * State update queue for managing sequential state updates
 * Ensures updates are processed one at a time to prevent race conditions
 */
export class StateUpdateQueue<T> {
  private queue: Array<() => Promise<T>> = []
  private processing = false

  /**
   * Add an update function to the queue
   * @param updateFn Function that returns a promise with the update result
   * @returns Promise that resolves when the update is processed
   */
  public enqueue(updateFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await updateFn()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })

      this.processQueue()
    })
  }

  /**
   * Process the queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    try {
      const updateFn = this.queue.shift()
      if (updateFn) {
        await updateFn()
      }
    } finally {
      this.processing = false
      if (this.queue.length > 0) {
        await this.processQueue()
      }
    }
  }
}

