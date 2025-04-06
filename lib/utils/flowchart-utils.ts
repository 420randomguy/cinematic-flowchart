import type { Edge, Node } from "reactflow"
import { isValidConnection, type NodeCategory } from "@/types/node-model"

/**
 * Connection lookup table type
 * Provides efficient access to node connections and relationships
 */
export type ConnectionLookup = {
  // Maps target node IDs to arrays of source node IDs
  targetToSources: Map<string, string[]>
  // Maps source node IDs to arrays of target node IDs
  sourceToTargets: Map<string, string[]>
  // Maps node IDs to node types
  nodeTypes: Map<string, NodeCategory>
  // Helper methods
  getSourceNodes: (targetId: string) => string[]
  getTargetNodes: (sourceId: string) => string[]
  getNodeType: (nodeId: string) => NodeCategory | undefined
  isValidConnection: (sourceId: string, targetId: string, sourceHandle?: string, targetHandle?: string) => boolean
}

/**
 * Creates a simplified connection lookup table from edges and nodes
 */
export function createConnectionLookup(edges: Edge[], nodes: Node[]): ConnectionLookup {
  const targetToSources = new Map<string, string[]>()
  const sourceToTargets = new Map<string, string[]>()
  const nodeTypes = new Map<string, NodeCategory>()

  // Build node type lookup
  nodes.forEach((node) => {
    nodeTypes.set(node.id, node.type as NodeCategory)
  })

  // Build connection lookups
  edges.forEach((edge) => {
    // Add to target -> sources map
    if (!targetToSources.has(edge.target)) {
      targetToSources.set(edge.target, [])
    }
    targetToSources.get(edge.target)?.push(edge.source)

    // Add to source -> targets map
    if (!sourceToTargets.has(edge.source)) {
      sourceToTargets.set(edge.source, [])
    }
    sourceToTargets.get(edge.source)?.push(edge.target)
  })

  // Helper methods
  const getSourceNodes = (targetId: string): string[] => {
    return targetToSources.get(targetId) || []
  }

  const getTargetNodes = (sourceId: string): string[] => {
    return sourceToTargets.get(sourceId) || []
  }

  const getNodeType = (nodeId: string): NodeCategory | undefined => {
    return nodeTypes.get(nodeId)
  }

  // Check if a connection is valid based on node types
  const checkValidConnection = (
    sourceId: string,
    targetId: string,
    sourceHandle?: string,
    targetHandle?: string,
  ): boolean => {
    const sourceType = nodeTypes.get(sourceId)
    const targetType = nodeTypes.get(targetId)

    if (!sourceType || !targetType) return false

    return isValidConnection(sourceType, targetType, sourceHandle, targetHandle)
  }

  return {
    targetToSources,
    sourceToTargets,
    nodeTypes,
    getSourceNodes,
    getTargetNodes,
    getNodeType,
    isValidConnection: checkValidConnection,
  }
}

