"use client"

import { useState } from "react"

/**
 * Timing optimization utilities for React
 * These utilities help manage the frequency of state updates and function calls
 */

import { useRef, useEffect, useCallback } from "react"

/**
 * Standard debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Standard throttle function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= wait) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * React hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * React hook for debounced callbacks
 * @param callback Callback to debounce
 * @param delay Delay in milliseconds
 * @param deps Dependencies array
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = [],
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...deps])

  return useCallback(
    debounce((...args: Parameters<T>) => {
      callbackRef.current(...args)
    }, delay) as T,
    [delay],
  )
}

/**
 * React hook for throttled callbacks
 * @param callback Callback to throttle
 * @param delay Delay in milliseconds
 * @param deps Dependencies array
 * @returns Throttled callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = [],
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...deps])

  return useCallback(
    throttle((...args: Parameters<T>) => {
      callbackRef.current(...args)
    }, delay) as T,
    [delay],
  )
}

