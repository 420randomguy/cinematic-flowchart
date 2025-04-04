"use client"

import type React from "react"

import { useContext } from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  addEdge,
  Background,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  applyNodeChanges,
  applyEdgeChanges,
  useStoreApi,
  type Node,
  type Connection,
} from "reactflow"
import "reactflow/dist/style.css"

import AnalysisNode from "@/components/nodes/analysis-node"
import VideoNode from "@/components/nodes/VideoNode"
import ImageNode from "@/components/nodes/ImageNode"
import BasicImageNode from "@/components/nodes/BasicImageNode"
import AssetBoardPanel from "@/components/panels/AssetBoardPanel"
import CanvasContextMenu from "@/components/canvas/CanvasContextMenu"
import CanvasToolbar from "@/components/controls/CanvasToolbar"
import ImageCropModal from "@/components/modals/ImageCropModal"
import UserProfileButton from "@/components/ui/UserProfileButton"
import { ImageLibraryProvider } from "@/contexts/ImageLibraryContext"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import ImageToImageNode from "@/components/nodes/ImageToImageNode"
import DebugPanel from "@/components/debug/debug-panel"
import { FlowchartContext } from "@/contexts/FlowchartContext"

/**
 * Node type definitions for the canvas
 */
const nodeTypes = {
  analysis: AnalysisNode,
  video: VideoNode,
  "text-to-image": ImageNode,
  "image-to-image": ImageToImageNode,
  image: BasicImageNode,
}

/**
 * Initial nodes for the canvas
 */
const initialNodes = []

/**
 * Initial edges for the canvas
 */
const initialEdges = []

/**
 * FlowchartCanvasInner Component
 *
 * Main canvas component that handles the ReactFlow instance and all canvas interactions
 */
function FlowchartCanvasInner() {
  // Canvas state
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sourceNodeId?: string } | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Refs
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  // ReactFlow hooks
  const { project, fitView, getNode, getNodes, getEdges } = useReactFlow()
  const store = useStoreApi()

  // Image crop state
  const [cropImage, setCropImage] = useState<{
    file: File
    dataUrl: string
    position: { x: number; y: number }
  } | null>(null)

  // History state for undo/redo
  const [undoStack, setUndoStack] = useState<Array<{ nodes: any[]; edges: any[] }>>([])
  const [redoStack, setRedoStack] = useState<Array<{ nodes: any[]; edges: any[] }>>([])
  const [isUndoRedoing, setIsUndoRedoing] = useState(false)

  // Clipboard state for copy/paste
  const [clipboard, setClipboard] = useState<any | null>(null)

  // Update the FlowchartCanvasInner component to pass the selected node type
  // First, add a state to track the selected node type
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null)

  // Connection state
  const [connectionStartNodeId, setConnectionStartNodeId] = useState<string | null>(null)
  const [connectionStartHandleType, setConnectionStartHandleType] = useState<string | null>(null)
  const [connectionStartHandleId, setConnectionStartHandleId] = useState<string | null>(null)
  const [connectionPreview, setConnectionPreview] = useState<{ nodeId: string; handleId: string } | null>(null)

  const { addImage } = useContext(ImageLibraryContext)

  /**
   * Save current state to undo stack
   */
  const saveState = useCallback(() => {
    if (isUndoRedoing) return

    setUndoStack((prev) => [
      ...prev,
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    ])
    setRedoStack([])
  }, [nodes, edges, isUndoRedoing, setUndoStack, setRedoStack])

  /**
   * Handle node changes (position, selection, etc.)
   */
  const handleNodesChange = useCallback(
    (changes) => {
      // Save state before applying changes
      if (changes.some((change) => change.type === "remove")) {
        saveState()
      }

      // Apply the changes to nodes
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds)

        // Add a selection effect to the selected node
        return updatedNodes.map((node) => {
          if (node.selected) {
            // Update the selectedNodeId state
            setSelectedNodeId(node.id)
            // Add a subtle glow to the selected node
            return {
              ...node,
              style: {
                ...node.style,
                filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))",
              },
            }
          } else {
            // Remove any glow from unselected nodes
            const { filter, ...restStyle } = node.style || {}
            return {
              ...node,
              style: restStyle,
            }
          }
        })
      })
    },
    [saveState, setSelectedNodeId, setNodes],
  )

  /**
   * Handle edge changes (deletion, etc.)
   */
  const handleEdgesChange = useCallback(
    (changes) => {
      // Save state before applying changes
      if (changes.some((change) => change.type === "remove")) {
        saveState()
      }

      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [saveState, setEdges],
  )

  /**
   * Determine the appropriate target handle based on source and target node types
   */
  const getTargetHandle = useCallback((sourceNode: Node, targetNode: Node): string | undefined => {
    // For video nodes, determine the appropriate target handle based on source node type
    if (targetNode.type === "video") {
      if (sourceNode.type === "analysis") {
        return "video-text-input"
      } else if (
        sourceNode.type === "image" ||
        sourceNode.type === "text-to-image" ||
        sourceNode.type === "image-to-image"
      ) {
        return "video-image-input"
      }
    }

    // For text-to-image nodes, if source is analysis, connect to the default input
    if (targetNode.type === "text-to-image" && sourceNode.type === "analysis") {
      return "image-input"
    }

    return undefined
  }, [])

  /**
   * Handle connection between nodes
   */
  const handleConnect = useCallback(
    (params: Connection) => {
      // Save current state before adding a connection
      saveState()

      // Get source and target nodes
      const sourceNode = nodes.find((node) => node.id === params.source)
      const targetNode = nodes.find((node) => node.id === params.target)

      if (!sourceNode || !targetNode) return

      // If connecting to a node without a specific handle, determine the appropriate handle
      if (!params.targetHandle) {
        params.targetHandle = getTargetHandle(sourceNode, targetNode)
      }

      // Handle connections to text-to-image nodes
      if (targetNode.type === "text-to-image" && sourceNode.type === "analysis") {
        // Add the edge
        setEdges((eds) => addEdge(params, eds))

        // Update target node with source node's content
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  sourceNodeContent: sourceNode.data.content,
                },
              }
            }
            return node
          }),
        )

        return
      }

      // Handle connections to video nodes
      if (targetNode.type === "video") {
        // Add the edge
        setEdges((eds) => addEdge(params, eds))

        // If connecting text to video, update the video node with the text content
        if (sourceNode.type === "analysis" && params.targetHandle === "video-text-input") {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === params.target) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    sourceNodeContent: sourceNode.data.content,
                  },
                }
              }
              return node
            }),
          )
        }

        // Force the target node to update by triggering a small change
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === params.target) {
                return { ...node, data: { ...node.data, _lastUpdated: Date.now() } }
              }
              return node
            }),
          )
        }, 50)

        return
      }

      // Handle connections to image nodes
      if (sourceNode.type === "analysis" && (targetNode.type === "image" || targetNode.type === "image-to-image")) {
        // Add the edge
        setEdges((eds) => addEdge(params, eds))

        // Update target node with source node's content
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.target) {
              return {
                ...node,
                data: {
                  ...node.data,
                  sourceNodeContent: sourceNode.data.content,
                },
              }
            }
            return node
          }),
        )

        return
      }

      // For all other connections, just add the edge
      setEdges((eds) => addEdge(params, eds))

      // Force the target node to update by triggering a small change
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.target) {
              return { ...node, data: { ...node.data, _lastUpdated: Date.now() } }
            }
            return node
          }),
        )
      }, 50)
    },
    [nodes, saveState, setNodes, setEdges, getTargetHandle],
  )

  /**
   * Handle double-click on edge to delete it
   */
  const handleEdgeDoubleClick = useCallback(
    (event, edge) => {
      // Save current state before removing the edge
      saveState()

      // Remove the edge
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
    },
    [saveState, setEdges],
  )

  /**
   * Handle connection start for showing context menu when dragging to empty canvas
   */
  const handleConnectStart = useCallback(
    (event, { nodeId, handleType, handleId }) => {
      // Store the connection start info
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
    [nodes, setSelectedNodeId, setSelectedNodeType, setConnectionStartNodeId],
  )

  /**
   * Find the closest node to a point
   */
  const findClosestNode = useCallback(
    (point: { x: number; y: number }, excludeNodeId?: string): Node | null => {
      const allNodes = getNodes()
      const reactFlowBounds = canvasWrapperRef.current?.getBoundingClientRect()
      if (!reactFlowBounds) return null

      // Convert screen coordinates to flow coordinates
      const flowPoint = project({
        x: point.x - reactFlowBounds.left,
        y: point.y - reactFlowBounds.top,
      })

      let closestNode: Node | null = null
      let closestDistance = Number.POSITIVE_INFINITY

      // Get the source node to determine compatible targets
      const sourceNode = excludeNodeId ? getNode(excludeNodeId) : null

      for (const node of allNodes) {
        if (node.id === excludeNodeId) continue

        // Skip incompatible node types based on source node
        if (sourceNode) {
          // If dragging from a prompt node, only connect to image or video nodes
          if (
            sourceNode.type === "analysis" &&
            !(
              node.type === "text-to-image" ||
              node.type === "video" ||
              node.type === "image-to-image" ||
              node.type === "image"
            )
          ) {
            continue
          }

          // If dragging from an image node, only connect to video nodes
          if (sourceNode.type.includes("image") && node.type !== "video") {
            continue
          }

          // If dragging from a video node, don't connect to anything
          if (sourceNode.type === "video") {
            continue
          }
        }

        // Calculate the center of the node
        const nodeCenter = {
          x: node.position.x + (node.width || 260) / 2,
          y: node.position.y + (node.height || 200) / 2,
        }

        // Calculate distance to node center
        const distance = Math.sqrt(Math.pow(flowPoint.x - nodeCenter.x, 2) + Math.pow(flowPoint.y - nodeCenter.y, 2))

        // Check if this node is closer than the current closest
        if (distance < closestDistance && distance < 200) {
          // 200px threshold - increased from 150px for better detection
          closestNode = node
          closestDistance = distance
        }
      }

      return closestNode
    },
    [getNodes, getNode, project],
  )

  /**
   * Handle connection end for showing context menu when dragging to empty canvas
   */
  const handleConnectEnd = useCallback(
    (event) => {
      // Only proceed if we have a valid connection start
      if (!connectionStartNodeId) return

      // Get the source node
      const sourceNode = getNode(connectionStartNodeId)
      if (!sourceNode) {
        // Reset connection state
        setConnectionStartNodeId(null)
        setConnectionStartHandleType(null)
        setConnectionStartHandleId(null)
        return
      }

      // Check if we're dropping on a node by looking at elements under the cursor
      const elementsUnderCursor = document.elementsFromPoint(event.clientX, event.clientY)

      // Find if any element is a node or part of a node
      const nodeElement = elementsUnderCursor.find(
        (el) => el.classList.contains("react-flow__node") || el.closest(".react-flow__node"),
      )

      // If we found a node element, handle node-to-node connection
      if (nodeElement) {
        const nodeId =
          nodeElement.getAttribute("data-id") || nodeElement.closest(".react-flow__node")?.getAttribute("data-id")

        // Only connect if it's a different node
        if (nodeId && nodeId !== connectionStartNodeId) {
          const targetNode = getNode(nodeId)
          if (targetNode) {
            // Determine appropriate handle ID based on node types
            let validHandleId = null
            if (connectionStartHandleType === "source") {
              if (sourceNode.type === "analysis") {
                if (targetNode.type === "video") {
                  validHandleId = "video-text-input"
                } else if (targetNode.type === "text-to-image") {
                  validHandleId = "image-input"
                }
              } else if (sourceNode.type.includes("image")) {
                if (targetNode.type === "video") {
                  validHandleId = "video-image-input"
                }
              }
            }

            // Create connection parameters
            const isSourceToTarget = connectionStartHandleType === "source"
            const params = isSourceToTarget
              ? {
                  source: connectionStartNodeId,
                  target: nodeId,
                  sourceHandle: connectionStartHandleId,
                  targetHandle: validHandleId || getTargetHandle(sourceNode, targetNode),
                }
              : {
                  source: nodeId,
                  target: connectionStartNodeId,
                  sourceHandle: validHandleId || undefined,
                  targetHandle: connectionStartHandleId,
                }

            // Create the connection
            handleConnect(params)
          }
        }
      } else {
        // We're not dropping on a node, so show the context menu
        // Make sure we're on the canvas pane
        const isOnCanvasPane = elementsUnderCursor.some(
          (el) =>
            el.classList.contains("react-flow__pane") ||
            el.classList.contains("react-flow__renderer") ||
            el.classList.contains("react-flow__container") ||
            el.classList.contains("react-flow"),
        )

        if (isOnCanvasPane) {
          // Show context menu at the drop position
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            sourceNodeId: connectionStartNodeId,
          })
        }
      }

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
      handleConnect,
      getTargetHandle,
      setContextMenu,
      setConnectionStartNodeId,
    ],
  )

  /**
   * Handle context menu on canvas
   */
  const handleContextMenu = useCallback(
    (event) => {
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
    },
    [project, setContextMenu],
  )

  /**
   * Close the context menu
   */
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [setContextMenu])

  // Also update the handlePaneClick to clear the selected node type
  const handlePaneClick = useCallback(() => {
    handleCloseContextMenu()
    setSelectedNodeId(null)
    setSelectedNodeType(null)
  }, [handleCloseContextMenu, setSelectedNodeId, setSelectedNodeType])

  /**
   * Add a new node to the canvas
   */
  const handleAddNode = useCallback(
    (
      type: "analysis" | "text-to-image" | "video" | "image-to-image" | "image",
      imageData?: { file: File; dataUrl: string },
      nodeData?: any,
    ) => {
      if (contextMenu) {
        // Save current state before adding a new node
        saveState()

        const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
        if (canvasBounds) {
          const position = project({
            x: contextMenu.x - canvasBounds.left,
            y: contextMenu.y - canvasBounds.top,
          })

          const newNodeId = `node_${Date.now()}`
          const newNode = {
            id: newNodeId,
            type,
            position,
            data: nodeData || {
              title:
                type === "analysis"
                  ? "PROMPT TITLE"
                  : type === "text-to-image"
                    ? "TEXT-TO-IMAGE TITLE"
                    : type === "image-to-image"
                      ? "IMAGE-TO-IMAGE TITLE"
                      : type === "image"
                        ? "IMAGE TITLE"
                        : "VIDEO TITLE",
              showImage: type !== "analysis",
              category: type === "analysis" ? "text" : type,
              seed: Math.floor(Math.random() * 1000000000).toString(),
              content: "",
              imageUrl: imageData?.dataUrl || null,
              imageFile: imageData?.file || null,
              isNewNode: true,
            },
            style: {
              width: 260,
            },
          }

          // Add the new node
          setNodes((nds) => [...nds, newNode])

          // If we have a source node ID, create a connection
          if (contextMenu.sourceNodeId) {
            // Only connect if the source is a prompt and target is image/video/image-to-image
            if (type === "text-to-image" || type === "video" || type === "image-to-image" || type === "image") {
              const sourceNode = nodes.find((node) => node.id === contextMenu.sourceNodeId)

              // Create the edge with appropriate target handle for video nodes
              const newEdge = {
                id: `e${contextMenu.sourceNodeId}-${newNodeId}`,
                source: contextMenu.sourceNodeId,
                target: newNodeId,
                animated: true,
                style: { stroke: "#444", strokeWidth: 1 },
                // Add targetHandle for video nodes
                ...(type === "video" ? { targetHandle: "video-text-input" } : {}),
              }

              setEdges((eds) => [...eds, newEdge])

              // Update the new node with the source node's content
              if (sourceNode && sourceNode.data.content) {
                setNodes((nds) =>
                  nds.map((node) => {
                    if (node.id === newNodeId) {
                      return {
                        ...node,
                        data: {
                          ...node.data,
                          sourceNodeContent: sourceNode.data.content,
                        },
                      }
                    }
                    return node
                  }),
                )
              }
            }
          }

          handleCloseContextMenu()
        }
      }
    },
    [contextMenu, project, saveState, handleCloseContextMenu, nodes, setNodes, setEdges],
  )

  /**
   * Copy the selected node
   */
  const handleCopyNode = useCallback(() => {
    if (!selectedNodeId) return

    const selectedNode = nodes.find((node) => node.id === selectedNodeId)
    if (selectedNode) {
      // Store a deep copy of the node data
      setClipboard({
        type: selectedNode.type,
        data: JSON.parse(JSON.stringify(selectedNode.data)),
        style: JSON.parse(JSON.stringify(selectedNode.style)),
      })
    }
  }, [selectedNodeId, nodes, setClipboard])

  /**
   * Paste the copied node at the current mouse position
   */
  const handlePasteNode = useCallback(() => {
    if (!clipboard) return

    // Get the current mouse position from the document
    const mousePosition = {
      x: 0,
      y: 0,
    }

    // Use the most recent mouse event to get the position
    const handleMouseMove = (e) => {
      mousePosition.x = e.clientX
      mousePosition.y = e.clientY

      // Remove the listener after capturing position
      document.removeEventListener("mousemove", handleMouseMove)

      // Now paste at this position
      pasteAtPosition(mousePosition)
    }

    // Function to paste at the given position
    const pasteAtPosition = (position) => {
      const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
      if (!canvasBounds) return

      // Calculate position relative to the canvas
      const canvasPosition = project({
        x: position.x - canvasBounds.left,
        y: position.y - canvasBounds.top,
      })

      // Create a new node with the copied data
      const newNodeId = `node_${Date.now()}`
      const newNode = {
        id: newNodeId,
        type: clipboard.type,
        position: canvasPosition,
        data: JSON.parse(JSON.stringify(clipboard.data)),
        style: JSON.parse(JSON.stringify(clipboard.style)),
      }

      // Save current state before adding a new node
      saveState()

      // Add the new node
      setNodes((nds) => [...nds, newNode])
    }

    // Add listener to get the current mouse position
    document.addEventListener("mousemove", handleMouseMove, { once: true })

    // If no mouse movement is detected within a short time, use the last known position
    setTimeout(() => {
      document.removeEventListener("mousemove", handleMouseMove)
      if (mousePosition.x === 0 && mousePosition.y === 0) {
        // Fallback to center of viewport if no position is available
        const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
        if (canvasBounds) {
          mousePosition.x = canvasBounds.left + canvasBounds.width / 2
          mousePosition.y = canvasBounds.top + canvasBounds.height / 2
          pasteAtPosition(mousePosition)
        }
      }
    }, 100)
  }, [clipboard, project, saveState, setNodes])

  /**
   * Handle node selection
   */
  const handleNodeClick = useCallback(
    (event, node) => {
      setSelectedNodeId(node.id)
      setSelectedNodeType(node.type)

      // Update the nodes to add glow to the selected node
      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id === node.id) {
            return {
              ...n,
              style: {
                ...n.style,
                filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))",
              },
            }
          } else {
            // Remove glow from other nodes
            const { filter, ...restStyle } = n.style || {}
            return {
              ...n,
              style: restStyle,
            }
          }
        }),
      )
    },
    [setSelectedNodeType, setSelectedNodeId, setNodes],
  )

  /**
   * Implement undo function
   */
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return

    setIsUndoRedoing(true)

    // Get the last state from the undo stack
    const prevState = undoStack[undoStack.length - 1]

    // Save current state to redo stack
    setRedoStack((prev) => [
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
      ...prev,
    ])

    // Remove the last state from undo stack
    setUndoStack((prev) => prev.slice(0, -1))

    // Apply the previous state
    setNodes(JSON.parse(JSON.stringify(prevState.nodes)))
    setEdges(JSON.parse(JSON.stringify(prevState.edges)))

    setTimeout(() => setIsUndoRedoing(false), 50)
  }, [undoStack, nodes, edges, setNodes, setEdges, setUndoStack, setRedoStack])

  /**
   * Implement redo function
   */
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return

    setIsUndoRedoing(true)

    // Get the first state from the redo stack
    const nextState = redoStack[0]

    // Save current state to undo stack
    setUndoStack((prev) => [
      ...prev,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
    ])

    // Remove the first state from redo stack
    setRedoStack((prev) => prev.slice(1))

    // Apply the next state
    setNodes(JSON.parse(JSON.stringify(nextState.nodes)))
    setEdges(JSON.parse(JSON.stringify(nextState.edges)))

    setTimeout(() => setIsUndoRedoing(false), 50)
  }, [redoStack, nodes, edges, setNodes, setEdges, setUndoStack, setRedoStack])

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault()
        handleUndo()
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault()
        handleRedo()
      }

      // Copy: Ctrl+C or Cmd+C
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault()
        handleCopyNode()
      }

      // Paste: Ctrl+V or Cmd+V
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault()
        handlePasteNode()
      }

      // Delete selected node
      if (event.key === "Delete" && selectedNodeId) {
        event.preventDefault()

        // Save state before deletion
        saveState()

        // Find connected edges
        const connectedEdges = edges.filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)

        // Remove connected edges
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId))

        // Remove the node
        setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId))

        // Clear selection
        setSelectedNodeId(null)
      }
    },
    [
      handleUndo,
      handleRedo,
      selectedNodeId,
      edges,
      saveState,
      handleCopyNode,
      handlePasteNode,
      setNodes,
      setEdges,
      setSelectedNodeId,
    ],
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

  /**
   * Handle drag and drop for images
   */
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
              addImage(dataUrl)

              // Create an image element to get dimensions
              const img = new Image()
              img.onload = () => {
                // Save current state before adding a new node
                saveState()

                // Create a new image node
                const newNodeId = `image_${Date.now()}`
                const newNode = {
                  id: newNodeId,
                  type: "image",
                  position: project(position),
                  data: {
                    title: "DROPPED IMAGE",
                    showImage: true,
                    category: "image",
                    seed: Math.floor(Math.random() * 1000000000).toString(),
                    content: "",
                    imageUrl: dataUrl,
                    imageFile: file,
                    isNewNode: true,
                    category: "image",
                    seed: Math.floor(Math.random() * 1000000000).toString(),
                    content: "",
                    imageUrl: dataUrl,
                    imageFile: file,
                    isNewNode: true,
                  },
                  style: {
                    width: 280,
                  },
                }

                // Add the new node
                setNodes((nds) => [...nds, newNode])
              }
              img.src = dataUrl
              img.crossOrigin = "anonymous" // Add this to prevent CORS issues
            }
            reader.readAsDataURL(file)
          }
        }
      }

      // Check if we're dropping an item from the Asset Board
      const reactflowData = event.dataTransfer.getData("application/reactflow")
      if (reactflowData) {
        try {
          const parsedData = JSON.parse(reactflowData)
          const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
          if (canvasBounds) {
            const position = {
              x: event.clientX - canvasBounds.left,
              y: event.clientY - canvasBounds.top,
            }

            // Save current state before adding a new node
            saveState()

            const newNodeId = `node_${Date.now()}`
            const newNode = {
              id: newNodeId,
              type: parsedData.type,
              position: project(position),
              data: {
                ...parsedData.data,
                isNewNode: true,
              },
              style: {
                width: 280,
              },
            }

            // Add the new node
            setNodes((nds) => [...nds, newNode])
          }
        } catch (error) {
          console.error("Error parsing drag data:", error)
        }
      }
    },
    [project, saveState, setNodes, addImage],
  )

  /**
   * Handle completion of image cropping
   */
  const handleCropComplete = useCallback(
    (croppedImageUrl, aspectRatio) => {
      if (cropImage) {
        // Save current state before adding a new node
        saveState()

        // Create a new node with the cropped image
        const newNodeId = `node_${Date.now()}`
        const newNode = {
          id: newNodeId,
          type: "video",
          position: cropImage.position,
          data: {
            title: "DROPPED IMAGE",
            showImage: true,
            category: "video",
            seed: Math.floor(Math.random() * 1000000000).toString(),
            content: "",
            imageUrl: croppedImageUrl,
            aspectRatio: aspectRatio,
          },
          style: {
            width: 280,
          },
        }

        // Add the new node
        setNodes((nds) => [...nds, newNode])

        // Close the crop tool
        setCropImage(null)
      }
    },
    [cropImage, saveState, setNodes, setCropImage],
  )

  /**
   * Handle cancellation of image cropping
   */
  const handleCropCancel = useCallback(() => {
    setCropImage(null)
  }, [setCropImage])

  // Add a new state variable to track if we're interacting with an input:
  const [isInteractingWithInput, setIsInteractingWithInput] = useState(false)

  // Add this function before the return statement
  const handleInputInteraction = useCallback((isInteracting = false) => {
    setIsInteractingWithInput(isInteracting)
  }, [])

  // Add this function before the return statement
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

    return true
  }, [])

  return (
    <div className="h-screen w-full flex flex-col bg-black font-mono">
      <FlowchartContext.Provider value={{ handleInputInteraction }}>
        <div className="flex-1 flex">
          <div className="flex-1 relative" ref={canvasWrapperRef} onDragOver={handleDragOver} onDrop={handleDrop}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onConnectStart={handleConnectStart}
              onConnectEnd={handleConnectEnd}
              onEdgeDoubleClick={handleEdgeDoubleClick}
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
              connectOnClick={true}
              edgesFocusable={true}
            >
              <Background color="#333" gap={16} />

              {/* User Profile Button */}
              <UserProfileButton />

              {/* Canvas Toolbar */}
              <CanvasToolbar
                onUndo={handleUndo}
                onRedo={handleRedo}
                onCopy={handleCopyNode}
                onPaste={handlePasteNode}
                isUndoAvailable={undoStack.length > 0}
                isRedoAvailable={redoStack.length > 0}
                isCopyAvailable={selectedNodeId !== null}
                isPasteAvailable={clipboard !== null}
              />

              {/* Context Menu */}
              {contextMenu && (
                <CanvasContextMenu
                  position={contextMenu}
                  onClose={handleCloseContextMenu}
                  onAddNode={handleAddNode}
                  sourceNodeId={contextMenu.sourceNodeId}
                />
              )}
            </ReactFlow>
          </div>
          <div className="w-[350px] bg-black border-l border-gray-800/50">
            <AssetBoardPanel />
          </div>
        </div>

        {/* Image Crop Modal */}
        {cropImage && (
          <ImageCropModal imageUrl={cropImage.dataUrl} onComplete={handleCropComplete} onCancel={handleCropCancel} />
        )}

        {/* Debug Panel */}
        <DebugPanel />
      </FlowchartContext.Provider>
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
      <ImageLibraryProvider>
        <FlowchartCanvasInner />
      </ImageLibraryProvider>
    </ReactFlowProvider>
  )
}

