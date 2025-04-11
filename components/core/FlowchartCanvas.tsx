"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
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
  addEdge,
} from "reactflow"
import "reactflow/dist/style.css"

// Add this import at the top of the file
import { isValidConnection, type NodeCategory } from "@/types/node-model"

// Import components
import CanvasContextMenu from "@/components/canvas/CanvasContextMenu"
import CanvasToolbar from "@/components/controls/CanvasToolbar"
import ImageCropModal from "@/components/modals/ImageCropModal"
import DebugPanel from "@/components/debug/debug-panel"
import UserProfileButton from "@/components/ui/user-profile-button"

// Import stores
import { useFlowchartStore } from "@/store/useFlowchartStore"
import { useImageLibraryStore } from "@/store/useImageLibraryStore"
import { useVisualMirrorStore } from "@/store/useVisualMirrorStore"

// Import node types - import at module level, outside any component
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
  
  // Get visual mirror functions
  const { showContent } = useVisualMirrorStore()

  // Refs
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const reactFlowInstanceRef = useRef<any>(null)

  // ReactFlow hooks
  const { project: screenToFlowPosition, fitView, getNode, getNodes, getEdges, setEdges } = useReactFlow()

  // Track mounted state
  const isMountedRef = useRef(false)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
   * Get the correct source handle for a node type
   */
  const getSourceHandle = useCallback((nodeType: string | undefined): string => {
    // Handle undefined case
    if (!nodeType) return "output";
    
    // Match the handle IDs defined in node-model.ts getSourceHandle function
    if (nodeType === "text") return "text"
    if (nodeType === "image" || nodeType === "text-to-image" || nodeType === "image-to-image") return "image"
    if (nodeType === "text-to-video" || nodeType === "image-to-video") return "video"
    
    // Default
    return "output"
  }, [])

  /**
   * Handle connection between nodes
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      // Get the source and target nodes
      const sourceNode = getNodes().find(n => n.id === connection.source);
      const targetNode = getNodes().find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Set the correct sourceHandle if missing
      if (!connection.sourceHandle) {
        if (sourceNode.type === "text") {
          connection.sourceHandle = "text";
        } else if (
          sourceNode.type === "image" || 
          sourceNode.type === "text-to-image" || 
          sourceNode.type === "image-to-image"
        ) {
          connection.sourceHandle = "image";
        } else if (
          sourceNode.type === "text-to-video" || 
          sourceNode.type === "image-to-video"
        ) {
          connection.sourceHandle = "video";
        } else {
          connection.sourceHandle = "output"; // Default fallback
        }
        console.log(`[FlowchartCanvas] Assigned sourceHandle=${connection.sourceHandle} for source node type ${sourceNode.type}`);
      }
      
      // Special handling for video connections to render nodes
      if ((sourceNode.type === "text-to-video" || sourceNode.type === "image-to-video") && 
          targetNode.type === "render") {
        // Force video handle for video-to-render connections
        connection.targetHandle = "video";
        console.log(`[FlowchartCanvas] Forced video targetHandle for video-to-render connection`);
      }
      
      // Debug connection details
      console.log(`[FlowchartCanvas] Creating edge with sourceHandle=${connection.sourceHandle}, targetHandle=${connection.targetHandle}`);
      
      // Use the store's onConnect method
      useFlowchartStore.getState().onConnect(connection);
    },
    [getNodes]
  );

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

      // Special handling for video nodes connecting to render nodes
      // Allow connections from video nodes to drop anywhere on the render node
      if ((sourceNode.type === "text-to-video" || sourceNode.type === "image-to-video") && 
          targetNode.type === "render") {
        // Create connection with explicit video target handle
        const connection: Connection = {
          source: connectionStartNodeId,
          sourceHandle: connectionStartHandleId || "video",
          target: targetNodeId,
          targetHandle: "video",
        }
        
        console.log("[FlowchartCanvas] Created video-to-render connection with explicit video handle")
        handleConnect(connection)
        
        // Reset connection state
        setConnectionStartNodeId(null)
        setConnectionStartHandleType(null)
        setConnectionStartHandleId(null)
        return
      }

      // Normal flow for other connection types
      // Determine the best target handle
      const targetHandleId = getTargetHandle(sourceNode, targetNode)
      if (!targetHandleId) return

      // Ensure we have the correct source handle ID
      const sourceHandleId = connectionStartHandleId || getSourceHandle(sourceNode.type);

      // Create the connection
      const connection: Connection = {
        source: connectionStartNodeId,
        sourceHandle: sourceHandleId,
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
      getSourceHandle,
      handleConnect,
      setConnectionStartNodeId,
      setConnectionStartHandleType,
      setConnectionStartHandleId,
    ]
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
        // Store the raw client coordinates
        setContextMenu({ x: event.clientX, y: event.clientY });
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

              try {
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
                  position,
                  data: nodeData,
                }

                // Save state before adding the node
                saveState()

                // Add the node to the flow
                setNodes((nodes) => [...nodes, newNode])
                
                // IMPORTANT: Update the Visual Mirror Store
                // This ensures the image will display in the node
                showContent(id, { imageUrl: dataUrl })
                
                // Add to library with error handling
                try {
                  addAsset({
                    url: dataUrl,
                    type: "image",
                    title: "Dropped Image",
                  })
                } catch (error) {
                  console.error("Failed to add image to library (continuing with node creation):", error);
                }
                
                console.log(`[FlowchartCanvas] Created new image node with id=${id} and updated VisualMirrorStore`)
              } catch (error) {
                console.error("Error creating image node:", error);
              }
            }
            reader.readAsDataURL(file)
          }
        }
      }
    },
    [canvasWrapperRef, saveState, addAsset, setNodes, showContent],
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
      const { x, y } = screenToFlowPosition({
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
  }, [screenToFlowPosition, saveState, setNodes, clipboard])

  // Memoize nodeTypes import to prevent recreating it on each render
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  
  // Preload node types when the component mounts
  useEffect(() => {
    preloadAllNodeTypes();
  }, []);

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
            nodeTypes={memoizedNodeTypes}
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
            panOnDrag={!isInteractingWithInput ? [1] : false}
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
                  const position = screenToFlowPosition({
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

      {/* User Profile Button */}
      <UserProfileButton />

      {/* Debug Panel */}
      <DebugPanel />
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

