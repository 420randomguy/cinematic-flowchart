"use client"

/**
 * Custom hook for efficient node connection lookups
 * This hook caches connection lookups to avoid recomputing on every render
 */

import { useMemo, useRef, useEffect } from "react"
import { useReactFlow } from "reactflow"
import { createConnectionLookup, type ConnectionLookup } from "@/lib/utils/flowchart-utils"

export function useConnectionLookup() {
  // Reference to the previous connection lookup
  const lookupRef = useRef<ConnectionLookup | null>(null)

  // Reference to the previous edges and nodes hash for comparison
  const prevHashRef = useRef<string>("")

  // Get ReactFlow state
  const { getNodes, getEdges } = useReactFlow()

  // Create or reuse the connection lookup based on current nodes and edges
  const connectionLookup = useMemo(() => {
    const nodes = getNodes()
    const edges = getEdges()

    // Create a hash of the current graph structure
    const edgesHash = edges
      .map((e) => `${e.source}-${e.target}`)
      .sort()
      .join("|")
    const nodesHash = nodes
      .map((n) => `${n.id}:${n.type}`)
      .sort()
      .join("|")
    const currentHash = `${nodesHash}|${edgesHash}`

    // If hash hasn't changed, reuse the previous lookup
    if (currentHash === prevHashRef.current && lookupRef.current) {
      return lookupRef.current
    }

    // Store the new hash
    prevHashRef.current = currentHash

    // Create a new lookup
    const newLookup = createConnectionLookup(edges, nodes)

    // Store the new lookup for future reuse
    lookupRef.current = newLookup

    return newLookup
  }, [getNodes, getEdges])

  // Clear lookup when component unmounts
  useEffect(() => {
    return () => {
      lookupRef.current = null
      prevHashRef.current = ""
    }
  }, [])

  return connectionLookup
}

