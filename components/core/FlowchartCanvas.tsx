"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  Background,
  ReactFlowProvider,
  ConnectionLineType,
  useStoreApi,
  type Connection,
  useReactFlow,
  type Node,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"

// Add this import at the top of the file
import { isValidConnection, type NodeCategory } from "@/types/node-model"

// Import components
import CanvasContextMenu from "@/components/canvas/CanvasContextMenu"
import CanvasToolbar from "@/components/controls/CanvasToolbar"
import ImageCropModal from "@/components/modals/ImageCropModal"
import DebugPanel from "@/components/debug/debug-panel"
import ElementReferencePanel from "@/components/ui/element-reference-panel"

// Import stores
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { useConnectionStore } from "@/store/useConnectionStore"

// Import node types
import { nodeTypes, preloadAllNodeTypes } from "@/lib/utils/dynamic-node-types"

// Import utilities
import { debounce, throttle } from "@/lib/utils/state-optimization"

/**
 * FlowchartCanvasInner Component
 *
 * Main canvas component that handles the ReactFlow instance and all canvas interactions
 */
function FlowchartCanvasInner() {
  // Get state from Zustand stores
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNodeId,
    isDragging,
    isInteractingWithInput,
    contextMenu,
    clipboard,
    cropImage,
    undoStack,
    redoStack,
    setContextMenu,
    clearContextMenu,
    saveState,
    undo,
    redo,
    setSelectedNodeId,
    setConnectionStartNodeId,
    setConnectionStartHandleType,
    setConnectionStartHandleId,
    setNodes,
    setClipboard,
    connectionStartNodeId,
    connectionStartHandleId,
    connectionStartHandleType,
  } = useFlowchartStore()

  // Add asset function from the image library store
  const { addAsset } = useImageLibraryStore()

  // Get the connection store's setCurrentNodesAndEdges function
  const { setCurrentNodesAndEdges } = useConnectionStore()

  // Refs
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlowInstanceRef = useRef<any>(null)

  // ReactFlow hooks
  const { project, fitView, getNode, getNodes, getEdges, setEdges } = useReactFlow()
  const store = useStoreApi()

  // Local state for the selected node type (not moving this to Zustand as it's very local)
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Flag to prevent multiple simultaneous state updates
  const isUpdatingRef = useRef(false)

  // Track mounted state
  const isMountedRef = useRef(false)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initialize connection lookup when nodes or edges change
  useEffect(() => {
    setCurrentNodesAndEdges(nodes, edges)
  }, [nodes, edges, setCurrentNodesAndEdges])

  // Store the ReactFlow instance
  const onInit = useCallback((reactFlowInstance) => {
    reactFlowInstanceRef.current = reactFlowInstance
  }, [])

  /**
   * Determine the appropriate target handle based on source and target node types
   */
  const getTargetHandle = useCallback((sourceNode: Node, targetNode: Node): string | undefined => {
    // Remove this line:
    // const { isValidConnection } = require("@/types/node-model");

    // First check if the connection is valid at the node type level
    if (!isValidConnection(sourceNode.type as any, targetNode.type as any)) {
      return undefined // Invalid connection
    }

    // Now determine the appropriate handle based on the source node type
    const isImageSource =
      sourceNode.type === "image" || sourceNode.type === "text-to-image" || sourceNode.type === "image-to-image"

    const isTextSource = sourceNode.type === "text" || sourceNode.type === "url"
    const isUrlSource = sourceNode.type === "url"

    // Return the appropriate handle type based on source type
    if (isImageSource) {
      return "image"
    } else if (isUrlSource) {
      return "url"
    } else if (isTextSource) {
      return "text"
    }

    return undefined
  }, [])

  /**
   * Handle connection between nodes
   */
  const handleConnect = useCallback(
    (params: Connection) => {
      // Validate that we have the required parameters
      if (!params || !params.source || !params.target) {
        console.error("Invalid connection parameters:", params)
        return
      }

      // Get the source and target nodes
      const sourceNode = getNode(params.source)
      const targetNode = getNode(params.target)

      if (!sourceNode || !targetNode) {
        console.error("Source or target node not found")
        return
      }

      // Remove this line:
      // const { isValidConnection } = require("@/types/node-model");

      // Step 1: Check if the connection is valid at the node type level
      if (
        !isValidConnection(sourceNode.type as any, targetNode.type as any, params.sourceHandle, params.targetHandle)
      ) {
        console.log("Invalid connection between", sourceNode.type, "and", targetNode.type)
        return
      }

      // Save current state before adding a connection
      saveState()

      // Step 2: Determine the appropriate target handle if not specified
      const targetHandleType = params.targetHandle || getTargetHandle(sourceNode, targetNode)

      if (!targetHandleType) {
        console.error("Could not determine target handle type")
        return
      }

      // Step 3: Find ALL existing edges that connect to this target node's specific handle
      const existingEdges = getEdges().filter(
        (edge) => edge.target === params.target && edge.targetHandle === targetHandleType,
      )

      // If there are existing connections to this handle, remove them ALL first
      if (existingEdges.length > 0) {
        console.log(`Replacing ${existingEdges.length} existing connections to ${params.target}:${targetHandleType}`)

        // Create removal changes for each existing edge
        const edgeRemovals = existingEdges.map((edge) => ({
          id: edge.id,
          type: "remove" as const,
        }))

        // Apply the edge removals
        onEdgesChange(edgeRemovals)
      }

      // Create a unique edge ID
      const edgeId = `e${params.source}-${params.target}-${Date.now()}`

      // Add the new connection
      setEdges((edges) => [
        ...edges,
        {
          id: edgeId,
          source: params.source,
          sourceHandle: params.sourceHandle,
          target: params.target,
          targetHandle: targetHandleType,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#444", strokeWidth: 1 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#444",
          },
        },
      ])

      // Propagate data from source to target
      if (sourceNode && targetNode) {
        console.log(`Connection created from ${sourceNode.type} to ${targetNode.type}`)

        // For image nodes, propagate the image URL
        if (
          (sourceNode.type === "image" ||
            sourceNode.type === "text-to-image" ||
            sourceNode.type === "image-to-image") &&
          sourceNode.data?.imageUrl
        ) {
          console.log(`Propagating image URL from ${params.source} to ${params.target}:`, sourceNode.data.imageUrl)

          // Update the connection store
          useConnectionStore.getState().updateNodeImageUrl(params.source, sourceNode.data.imageUrl)

          // Force propagation to the specific target
          useConnectionStore.getState().propagateUpdates(params.source, [params.target])
        }

        // For text nodes, propagate the content
        if ((sourceNode.type === "text" || sourceNode.type === "url") && sourceNode.data?.content) {
          console.log(`Propagating content from ${params.source} to ${params.target}:`, sourceNode.data.content)

          // Update the connection store
          useConnectionStore.getState().updateNodeContent(params.source, sourceNode.data.content)

          // Force propagation to the specific target
          useConnectionStore.getState().propagateUpdates(params.source, [params.target])
        }
      }
    },
    [saveState, onEdgesChange, getNode, getEdges, setEdges, getTargetHandle],
  )

  /**
   * Handle connection start for showing context menu when dragging to empty canvas
   */
  const handleConnectStart = useCallback(
    (event, { nodeId, handleType, handleId }) => {
      // Store the connection start info in Zustand
      setConnectionStartNodeId(nodeId)
      setConnectionStartHandleType(handleType)
      setConnectionStartHandleId(handleId)

      // Get the source node type
      const sourceNode = nodes.find((node) => node.id === nodeId)
      if (sourceNode) {
        setSelectedNodeType(sourceNode.type)
      }

      // Track source connections from any node type
      const isValidSource = handleType === "source" && sourceNode
      setSelectedNodeId(isValidSource ? nodeId : null)
    },
    [nodes, setSelectedNodeId, setConnectionStartNodeId, setConnectionStartHandleType, setConnectionStartHandleId],
  )

  /**
   * Handle connection end - this is where we implement the smart connection logic
   */
  const handleConnectEnd = useCallback(
    (event) => {
      // Only proceed if we have a valid connection start
      if (!connectionStartNodeId || !connectionStartHandleType) return

      // Get the element under the mouse
      const targetElement = document.elementFromPoint(event.clientX, event.clientY)
      if (!targetElement) return

      // Find the closest node element
      const nodeElement = targetElement.closest(".react-flow__node")
      if (!nodeElement) return

      // Get the node ID
      const targetNodeId = nodeElement.getAttribute("data-id")
      if (!targetNodeId || targetNodeId === connectionStartNodeId) return

      // Get the source and target nodes
      const sourceNode = getNode(connectionStartNodeId)
      const targetNode = getNode(targetNodeId)
      if (!sourceNode || !targetNode) return

      // Remove this line:
      // const { isValidConnection } = require("@/types/node-model");

      // Check if the connection is valid at the node type level
      if (
        !isValidConnection(
          sourceNode.type as NodeCategory,
          targetNode.type as NodeCategory,
          connectionStartHandleId,
          null,
        )
      ) {
        console.log("Invalid connection between", sourceNode.type, "and", targetNode.type)
        return
      }

      // Determine the best target handle
      const targetHandleId = getTargetHandle(sourceNode, targetNode)
      if (!targetHandleId) return

      // Create the connection
      const connection: Connection = {
        source: connectionStartNodeId,
        sourceHandle: connectionStartHandleId || undefined,
        target: targetNodeId,
        targetHandle: targetHandleId,
      }

      // Handle the connection using our handleConnect function
      handleConnect(connection)

      // Reset connection state
      setConnectionStartNodeId(null)
      setConnectionStartHandleType(null)
      setConnectionStartHandleId(null)
    },
    [
      connectionStartNodeId,
      connectionStartHandleType,
      connectionStartHandleId,
      getNode,
      getTargetHandle,
      handleConnect,
      setConnectionStartNodeId,
      setConnectionStartHandleType,
      setConnectionStartHandleId,
    ],
  )

  /**
   * Handle node mouse enter - highlight the node as a potential connection target
   */
  const handleNodeMouseEnter = useCallback(
    (event, node) => {
      setHoveredNode(node.id)

      // If we're currently dragging a connection, highlight this node as a potential target
      if (connectionStartNodeId && connectionStartNodeId !== node.id) {
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
        if (nodeElement) {
          // Get the source node
          const sourceNode = getNode(connectionStartNodeId)
          const targetNode = node

          // Remove this line:
          // const { isValidConnection } = require("@/types/node-model");

          // Check if this is a valid connection at the node type level
          if (
            sourceNode &&
            targetNode &&
            isValidConnection(sourceNode.type as any, targetNode.type as any, connectionStartHandleId, null)
          ) {
            // Determine the target handle
            const targetHandle = getTargetHandle(sourceNode, targetNode)

            // Check if there's already a connection of the same type
            const hasExistingConnection = getEdges().some(
              (edge) => edge.target === node.id && edge.targetHandle === targetHandle,
            )

            if (hasExistingConnection) {
              // Still valid, but will replace existing connection
              nodeElement.classList.add("valid-connection-target")
              nodeElement.classList.add("replace-connection-target")
            } else {
              // New valid connection
              nodeElement.classList.add("valid-connection-target")
            }
          } else {
            nodeElement.classList.add("invalid-connection-target")
          }
        }
      }
    },
    [connectionStartNodeId, connectionStartHandleId, getNode, getTargetHandle, getEdges],
  )

  /**
   * Handle node mouse leave - remove highlight
   */
  const handleNodeMouseLeave = useCallback((event, node) => {
    setHoveredNode(null)

    // Remove any connection target classes
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
    if (nodeElement) {
      nodeElement.classList.remove("valid-connection-target")
      nodeElement.classList.remove("invalid-connection-target")
      nodeElement.classList.remove("replace-connection-target") // Add this line
    }
  }, [])

  // Add these new event handlers after handleConnectStart

  // Use throttled context menu handler
  const handleContextMenu = useCallback(
    throttle((event) => {
      // Prevent the default context menu
      event.preventDefault()

      // Only show context menu if we're clicking on the canvas, not on a node
      if (event.target.classList.contains("react-flow__pane")) {
        // Get the position of the click relative to the canvas
        const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
        if (canvasBounds) {
          setContextMenu({ x: event.clientX, y: event.clientY })
        }
      }
    }, 100),
    [setContextMenu],
  )

  // Also update the handlePaneClick to clear the selected node type
  const handlePaneClick = useCallback(() => {
    clearContextMenu()
    setSelectedNodeId(null)
    setSelectedNodeType(null)
  }, [clearContextMenu, setSelectedNodeId])

  // Add these optimized drag handlers
  const handleNodeDragStart = useCallback((event: React.MouseEvent, node: any) => {
    // Check if the event target is an input, textarea, or select
    const target = event.target as HTMLElement
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.getAttribute("role") === "combobox" ||
      target.getAttribute("role") === "listbox" ||
      target.getAttribute("role") === "option" ||
      target.classList.contains("prevent-node-drag")

    if (isInput) {
      // Prevent the drag from starting
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    // Apply hardware acceleration to the node for smoother dragging
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
    if (nodeElement) {
      nodeElement.classList.add("dragging")
    }

    return true
  }, [])

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: any) => {
      // Remove hardware acceleration class
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
      if (nodeElement) {
        nodeElement.classList.remove("dragging")
      }

      // Save state after dragging is complete, not during
      requestAnimationFrame(() => {
        saveState()
      })
    },
    [saveState],
  )

  // Use debounced node click handler
  const handleNodeClick = useCallback(
    debounce((event, node) => {
      setSelectedNodeId(node.id)
      setSelectedNodeType(node.type)
    }, 50),
    [setSelectedNodeId, setSelectedNodeType],
  )

  /**
   * Handle copy and paste keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault()
        redo()
      }
    },
    [undo, redo],
  )

  /**
   * Add and remove keyboard event listener
   */
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Add these event listeners in a useEffect

  // Center the view on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({
        padding: 0.2,
        minZoom: 0.8,
        maxZoom: 1.2,
      })
    }, 100)
    return () => clearTimeout(timer)
  }, [fitView])

  // Handle drag and drop for images
  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  /**
   * Handle drop of images onto canvas
   */
  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()

      // Check if files are being dropped
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0]

        // Check if the file is an image
        if (file.type.startsWith("image/")) {
          const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
          if (canvasBounds) {
            const position = {
              x: event.clientX - canvasBounds.left,
              y: event.clientY - canvasBounds.top,
            }

            // Create a FileReader to read the image
            const reader = new FileReader()
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string

              // Save the image to the library
              addAsset({
                url: dataUrl,
                type: "image",
                title: "Dropped Image",
              })

              // Generate a unique ID for the new node
              const id = `image_${Date.now()}`

              // Create the node data
              const nodeData = {
                title: "IMAGE",
                showImage: true,
                category: "image",
                imageUrl: dataUrl,
                isNewNode: true,
              }

              // Create the new node
              const newNode = {
                id,
                type: "image",
                position: project(position),
                data: nodeData,
              }

              // Save state before adding the node
              saveState()

              // Add the node to the flow
              setNodes((nodes) => [...nodes, newNode])
            }
            reader.readAsDataURL(file)
          }
        }
      }
    },
    [project, saveState, addAsset, setNodes],
  )

  /**
   * Handle copy action
   */
  const handleCopy = useCallback(() => {
    // Only copy if a node is selected
    if (selectedNodeId) {
      const node = nodes.find((node) => node.id === selectedNodeId)
      if (node) {
        // Store the node data in the clipboard
        const clipboardData = {
          type: node.type,
          data: { ...node.data },
          style: { ...node.style },
        }

        // Save to Zustand store
        setClipboard(clipboardData)
      }
    }
  }, [selectedNodeId, nodes, setClipboard])

  /**
   * Handle paste action
   */
  const handlePaste = useCallback(() => {
    // Only paste if we have clipboard data
    if (clipboard) {
      // Generate a unique ID for the new node
      const id = `${clipboard.type}_${Date.now()}`

      // Get the current viewport center
      const { x, y } = project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })

      // Create the new node
      const newNode = {
        id,
        type: clipboard.type,
        position: { x, y },
        data: {
          ...clipboard.data,
          title: `${clipboard.data.title} (Copy)`,
          isNewNode: true,
        },
        style: { ...clipboard.style },
      }

      // Save state before adding the node
      saveState()

      // Add the node to the flow
      setNodes((nodes) => [...nodes, newNode])
    }
  }, [project, saveState, setNodes, clipboard])

  // Add this effect to preload node types when the component mounts
  useEffect(() => {
    // Preload all node types when the canvas mounts
    preloadAllNodeTypes()
  }, [])

  // Global event listener for content propagation
  useEffect(() => {
    const handleContentPropagation = (event: CustomEvent) => {
      const { sourceNodeId, content, targetNodeIds } = event.detail

      if (sourceNodeId && content && targetNodeIds && targetNodeIds.length > 0) {
        // Update all target nodes with the content from the source node
        setNodes((nodes) =>
          nodes.map((node) =>
            targetNodeIds.includes(node.id)
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: content,
                    _lastUpdated: Date.now(),
                  },
                }
              : node,
          ),
        )
      }
    }

    window.addEventListener("flowchart-content-update", handleContentPropagation as EventListener)

    return () => {
      window.removeEventListener("flowchart-content-update", handleContentPropagation as EventListener)
    }
  }, [setNodes])

  return (
    <div className="h-screen w-full flex flex-col bg-black font-mono">
      <div className="flex-1 flex">
        <div className="flex-1 relative" ref={canvasWrapperRef} onDragOver={handleDragOver} onDrop={handleDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onEdgeDoubleClick={(event, edge) => {
              // Save state before removing the edge
              saveState()

              // Remove the edge
              onEdgesChange([{ id: edge.id, type: "remove" }])
            }}
            nodeTypes={nodeTypes}
            fitView
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
              minZoom: 0.8,
              maxZoom: 1.2,
            }}
            onContextMenu={handleContextMenu}
            onPaneClick={handlePaneClick}
            onNodeClick={handleNodeClick}
            deleteKeyCode="Delete"
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: "#444", strokeWidth: 1 }}
            selectNodesOnDrag={false}
            nodeDragThreshold={5}
            selectionMode="partial"
            zoomOnDoubleClick={false}
            nodesDraggable={!isInteractingWithInput}
            panOnDrag={!isInteractingWithInput}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={() => {}} // Empty handler for drag event
            onNodeDragStop={handleNodeDragStop}
            connectOnClick={true}
            edgesFocusable={true}
            connectionMode="loose"
            snapToGrid={true}
            snapGrid={[15, 15]}
          >
            <Background color="#333" gap={16} />

            {/* Canvas Toolbar */}
            <CanvasToolbar
              onUndo={undo}
              onRedo={redo}
              onCopy={handleCopy}
              onPaste={handlePaste}
              isUndoAvailable={undoStack.length > 0}
              isRedoAvailable={redoStack.length > 0}
              isCopyAvailable={selectedNodeId !== null}
              isPasteAvailable={clipboard !== null}
            />

            {/* Context Menu */}
            {contextMenu && (
              <CanvasContextMenu
                position={contextMenu}
                onClose={clearContextMenu}
                onAddNode={(type) => {
                  // Get the position in the canvas coordinates
                  const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
                  if (!canvasBounds) return

                  // Convert screen coordinates to canvas coordinates
                  const position = project({
                    x: contextMenu.x - canvasBounds.left,
                    y: contextMenu.y - canvasBounds.top,
                  })

                  // Generate a unique ID for the new node
                  const id = `${type}_${Date.now()}`

                  // Create the node data based on type
                  const nodeData = {
                    title: type.toUpperCase(),
                    showImage: type !== "text" && type !== "url",
                    category: type,
                    seed: Math.floor(Math.random() * 1000000000).toString(),
                    content: "",
                    isNewNode: true,
                  }

                  // Create the new node
                  const newNode = {
                    id,
                    type,
                    position,
                    data: nodeData,
                  }

                  // Save state after adding the node
                  saveState()

                  // Add the node to the flow
                  setNodes((nodes) => [...nodes, newNode])

                  // Clear the context menu
                  clearContextMenu()
                }}
                sourceNodeId={contextMenu.sourceNodeId}
              />
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Image Crop Modal */}
      {cropImage && (
        <ImageCropModal
          imageUrl={cropImage.dataUrl}
          onComplete={() => {}} // Empty handler to be implemented
          onCancel={() => {}} // Empty handler to be implemented
        />
      )}

      {/* Debug Panel */}
      <DebugPanel />

      {/* Element Reference Panel */}
      <ElementReferencePanel />
    </div>
  )
}

/**
 * FlowchartCanvas Component
 *
 * Wrapper component that provides the ReactFlowProvider
 *
 * @returns {JSX.Element} The FlowchartCanvas component
 */
export default function FlowchartCanvas() {
  return (
    <ReactFlowProvider>
      <FlowchartCanvasInner />
    </ReactFlowProvider>
  )
}

