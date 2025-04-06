import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Edge, Node } from "reactflow"
import { createConnectionLookup, type ConnectionLookup } from "@/lib/utils/flowchart-utils"

interface ConnectionState {
  // Core state
  nodeContents: Record<string, string>
  nodeImageUrls: Record<string, string>

  // Connection data
  connectionLookup: ConnectionLookup | null

  // Actions
  updateNodeContent: (nodeId: string, content: string) => void
  updateNodeImageUrl: (nodeId: string, imageUrl: string) => void
  getNodeContent: (nodeId: string) => string | null
  getNodeImageUrl: (nodeId: string) => string | null

  // Utilities
  setCurrentNodesAndEdges: (nodes: Node[], edges: Edge[]) => void
  propagateUpdates: (sourceNodeId: string, targetNodeIds?: string[]) => void
}

// Create a default connection lookup with empty methods
const createEmptyConnectionLookup = (): ConnectionLookup => ({
  targetToSources: new Map(),
  sourceToTargets: new Map(),
  connections: new Map(),
  nodeTypes: new Map(),
  getSourceNodes: () => [],
  getTargetNodes: () => [],
  hasConnection: () => false,
  getConnection: () => undefined,
  getNodeType: () => undefined,
  getConnectedNodesOfType: () => [],
})

export const useConnectionStore = create<ConnectionState>()(
  devtools((set, get) => ({
    // Initial state
    nodeContents: {},
    nodeImageUrls: {},
    connectionLookup: createEmptyConnectionLookup(),

    // Update lookup from current nodes and edges
    setCurrentNodesAndEdges: (nodes, edges) => {
      set({ connectionLookup: createConnectionLookup(edges, nodes) })
    },

    // Update a node's content
    updateNodeContent: (nodeId: string, content: string) => {
      // Store the content in our state
      set((state) => ({
        nodeContents: {
          ...state.nodeContents,
          [nodeId]: content,
        },
      }))

      // Propagate to connected nodes
      get().propagateUpdates(nodeId)
    },

    // Update a node's image URL
    updateNodeImageUrl: (nodeId: string, imageUrl: string) => {
      // Store the image URL in our state
      set((state) => ({
        nodeImageUrls: {
          ...state.nodeImageUrls,
          [nodeId]: imageUrl,
        },
      }))

      // Propagate to connected nodes
      get().propagateUpdates(nodeId)
    },

    // Get a node's content
    getNodeContent: (nodeId: string) => {
      return get().nodeContents[nodeId] || null
    },

    // Get a node's image URL
    getNodeImageUrl: (nodeId: string) => {
      return get().nodeImageUrls[nodeId] || null
    },

    // Propagate updates to connected nodes
    propagateUpdates: (sourceNodeId: string, targetNodeIds?: string[]) => {
      const connectionLookup = get().connectionLookup
      if (!connectionLookup) return

      // Get target nodes if not provided
      const nodesToUpdate = targetNodeIds || connectionLookup.getTargetNodes(sourceNodeId)

      if (nodesToUpdate.length > 0) {
        // Get the content and image URL
        const content = get().nodeContents[sourceNodeId]
        const imageUrl = get().nodeImageUrls[sourceNodeId]

        // Dispatch events for content and image updates
        if (content) {
          const contentEvent = new CustomEvent("flowchart-content-update", {
            detail: { sourceNodeId, content, targetNodeIds: nodesToUpdate },
          })
          window.dispatchEvent(contentEvent)
        }

        if (imageUrl) {
          const imageEvent = new CustomEvent("flowchart-image-update", {
            detail: { sourceNodeId, imageUrl, targetNodeIds: nodesToUpdate },
          })
          window.dispatchEvent(imageEvent)
        }
      }
    },
  })),
)

