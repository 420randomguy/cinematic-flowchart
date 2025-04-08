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
  type ReactFlowInstance,
  type Edge,
  type NodeMouseHandler,
  type OnConnectStart,
  SelectionMode,
  ConnectionMode,
  type NodeDragHandler,
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
    selectedNodeId,
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
  const reactFlowInstanceRef = useRef<any>(null)

  // ReactFlow hooks
  const { project, fitView, getNode, getNodes, getEdges, setEdges } = useReactFlow()

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

  /**
   * Determine the appropriate target handle based on source and target node types
   */
  const getTargetHandle = useCallback((sourceNode: Node, targetNode: Node): string | undefined => {
    // First check if the connection is valid at the node type level
    if (!isValidConnection(sourceNode.type as any, targetNode.type as any)) {
      return undefined // Invalid connection
    }

    // Now determine the appropriate handle based on the source node type
    const isImageSource =
      sourceNode.type === "image" || sourceNode.type === "text-to-image" || sourceNode.type === "image-to-image"

    const isTextSource = sourceNode.type === "text"

    // Return the appropriate handle type based on source type
    if (isImageSource) {
      return "image"
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

      // Step 1: Check if the connection is valid at the node type level
      if (
        !isValidConnection(sourceNode.type as any, targetNode.type as any, params.sourceHandle, params.targetHandle)
      ) {
        console.log("Invalid connection between", sourceNode.type, "and", targetNode.type)
        return
      }

      // Save current state before adding a connection
      saveState()

      // Step 2: Determine the definitive target handle ID.
      // Prioritize the handle ID directly from params (usually from click-to-connect).
      // Fall back to getTargetHandle (usually from drag-to-connect via handleConnectEnd).
      let definitiveTargetHandleId = params.targetHandle;
      if (!definitiveTargetHandleId) {
        console.log("[handleConnect] params.targetHandle missing, trying getTargetHandle...")
        definitiveTargetHandleId = getTargetHandle(sourceNode, targetNode) ?? null;
      }

      // If we still don't have a handle ID, we cannot proceed reliably.
      if (!definitiveTargetHandleId) {
        console.error("[handleConnect] Could not determine target handle ID.", params);
        return
      }

      // Step 3: Find ALL existing edges connecting from the SAME SOURCE TYPE to this target node
      const existingEdges = getEdges().filter((edge) => {
        if (edge.target !== params.target) return false; // Must connect to the same target node
        const existingSourceNode = getNode(edge.source);
        // Check if the existing source node's type matches the new source node's type
        return existingSourceNode?.type === sourceNode.type;
      })

      // If there are existing connections of the same source type, remove them ALL first
      let edgesToRemoveIds: string[] = [];
      if (existingEdges.length > 0) {
        console.log(`[handleConnect] Replacing ${existingEdges.length} existing connection(s) of type ${sourceNode.type} to ${params.target}`)
        edgesToRemoveIds = existingEdges.map(edge => edge.id);
        // DO NOT call onEdgesChange here anymore
      }

      // Create a unique edge ID
      const edgeId = `e${params.source}-${params.target}-${Date.now()}`

      // Create the new edge definition
      const newEdge = {
        id: edgeId,
        source: params.source!,
        sourceHandle: params.sourceHandle,
        target: params.target!,
        targetHandle: definitiveTargetHandleId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#444", strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#444",
        },
      };

      // Atomically remove old edges and add the new one
      setEdges((currentEdges: Edge[]) => {
        // Filter out edges marked for removal
        const filteredEdges = currentEdges.filter(edge => !edgesToRemoveIds.includes(edge.id));
        // Add the new edge
        return [...filteredEdges, newEdge];
      });

      // Propagate data from source to target
      if (sourceNode && targetNode) {
        console.log(`Connection created from ${sourceNode.type} to ${targetNode.type}`)

        // For image nodes, potentially update the store if needed for other reasons (e.g., saving state)
        if (
          (sourceNode.type === "image" ||
            sourceNode.type === "text-to-image" ||
            sourceNode.type === "image-to-image") &&
          sourceNode.data?.imageUrl
        ) {
          console.log(`Propagating image URL from ${params.source} to ${params.target}:`, sourceNode.data.imageUrl)

          // Update the connection store (Keep this if store state is used elsewhere)
          useConnectionStore.getState().updateNodeImageUrl(params.source, sourceNode.data.imageUrl)
        }

        // For text nodes, potentially update the store if needed for other reasons
        if (sourceNode.type === "text" && sourceNode.data?.content) {
          console.log(`Propagating text content from ${params.source} to ${params.target}:`, sourceNode.data.content)
          // Store update for text content if needed
        }
      }
    },
    [getNode, getTargetHandle, getEdges, setEdges, saveState]
  )

  /**
   * Handle connection start for showing context menu when dragging to empty canvas
   */
  const handleConnectStart: OnConnectStart = useCallback(
    (event, { nodeId, handleType, handleId }) => {
      // Type assertion for event target
      const target = event.target as Element;

      // Check if interacting with an input field to prevent triggering connection start
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return;
      }

      // Store the connection start info in Zustand
      if (nodeId && handleType) {
        setConnectionStartNodeId(nodeId)
        setConnectionStartHandleType(handleType)
        setConnectionStartHandleId(handleId)

        // Track source connections from any node type
        // Check if the handle type is source before setting selectedNodeId
        const isValidSource = handleType === "source";
        setSelectedNodeId(isValidSource ? nodeId : null);
      }
    },
    [
      nodes,
      setSelectedNodeId,
      setConnectionStartNodeId,
      setConnectionStartHandleType,
      setConnectionStartHandleId,
    ],
  )

  /**
   * Handle connection end - this is where we implement the smart connection logic
   */
  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Only proceed if we have a valid connection start
      if (!connectionStartNodeId || !connectionStartHandleType) return

      // Get coordinates safely from MouseEvent or TouchEvent
      let clientX: number;
      let clientY: number;
      if ('touches' in event) {
        // Handle TouchEvent
        if (event.touches.length > 0) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else {
          // No touch points, cannot proceed
          return;
        }
      } else {
        // Handle MouseEvent
        clientX = event.clientX;
        clientY = event.clientY;
      }

      // Get the element under the coordinates
      const targetElement = document.elementFromPoint(clientX, clientY)
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
        sourceHandle: connectionStartHandleId,
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
  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (event, node) => {
      // If we're currently dragging a connection, highlight this node as a potential target
      if (connectionStartNodeId && connectionStartNodeId !== node.id) {
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
        if (nodeElement) {
          // Get the source node
          const sourceNode = getNode(connectionStartNodeId)
          const targetNode = node

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
    [connectionStartNodeId, connectionStartHandleId, getNode, getTargetHandle, getEdges, setSelectedNodeId],
  )

  /**
   * Handle node mouse leave - remove highlight
   */
  const handleNodeMouseLeave: NodeMouseHandler = useCallback((event, node) => {
    // Remove any connection target classes
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`)
    if (nodeElement) {
      nodeElement.classList.remove("valid-connection-target")
      nodeElement.classList.remove("invalid-connection-target")
      nodeElement.classList.remove("replace-connection-target")
    }
  }, [])

  // Add these new event handlers after handleConnectStart

  // Use throttled context menu handler
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      // Check if the click is on the pane or a node/edge
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');

      if (targetIsPane && canvasWrapperRef.current) {
        const bounds = canvasWrapperRef.current.getBoundingClientRect();
        setContextMenu({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      } else {
        setContextMenu(null); // Hide menu if clicking on node/edge
      }
    },
    [setContextMenu]
  );

  // Also update the handlePaneClick to clear the selected node type
  const handlePaneClick: (event: React.MouseEvent) => void = useCallback(() => {
    setContextMenu(null);
    setSelectedNodeId(null);
  }, [setContextMenu]);

  // Use debounced node click handler
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Prevent node selection when interacting with input elements
      const target = event.target as Element;
      if (target.closest('.input-wrapper, input, textarea, [contenteditable="true"]')) {
        return;
      }
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  /**
   * Handle copy and paste keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  /**
   * Handle drop of images onto canvas
   */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
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
        setClipboard(clipboardData as any)
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

  const handleNodeDragStart: NodeDragHandler = useCallback(
    (/*event, node*/) => {
      const { isUndoRedoing } = useFlowchartStore.getState()
      if (!isUndoRedoing) {
        saveState()
      }
    },
    [saveState],
  )

  const handleNodeDragStop: NodeDragHandler = useCallback(
    (/*event, node*/) => {
      // Ensure this is called after the node position has been updated by React Flow
      // No explicit action needed here currently, can be used for snapping or validation later
    },
    [],
  )

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
            onEdgeDoubleClick={(event: React.MouseEvent, edge: Edge) => {
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
            selectionMode={SelectionMode.Partial}
            zoomOnDoubleClick={false}
            nodesDraggable={!isInteractingWithInput}
            panOnDrag={!isInteractingWithInput}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={() => { /* Placeholder: Add logic if needed, e.g., nodeMovedRef.current = true; Ensure ref is defined */ }}
            onNodeDragStop={handleNodeDragStop}
            connectOnClick={true}
            edgesFocusable={true}
            connectionMode={ConnectionMode.Loose}
            snapToGrid={true}
            snapGrid={[15, 15]}
            className="bg-black"
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
                    showImage: type !== "text",
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
          onComplete={() => {}}
          onCancel={() => {}}
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

