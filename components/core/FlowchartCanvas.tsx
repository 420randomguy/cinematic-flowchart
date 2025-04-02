"use client"

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
} from "reactflow"
import "reactflow/dist/style.css"

import AnalysisNode from "@/components/nodes/analysis-node"
import VideoNode from "@/components/nodes/VideoNode"
import ImageNode from "@/components/nodes/ImageNode"
import AssetBoardPanel from "@/components/panels/AssetBoardPanel"
import CanvasContextMenu from "@/components/canvas/CanvasContextMenu"
import CanvasToolbar from "@/components/controls/CanvasToolbar"
import ImageCropModal from "@/components/modals/ImageCropModal"
import UserProfileButton from "@/components/ui/UserProfileButton"
import { ImageLibraryProvider } from "@/contexts/ImageLibraryContext"
import { ImageLibraryContext } from "@/contexts/ImageLibraryContext"
import ImageToImageNode from "@/components/nodes/ImageToImageNode"

/**
 * Node type definitions for the canvas
 */
const nodeTypes = {
  analysis: AnalysisNode,
  video: VideoNode,
  image: ImageNode,
  "image-to-image": ImageToImageNode, // Add the new node type
}

/**
 * Initial nodes for the canvas
 */
const initialNodes = [
  {
    id: "1",
    type: "analysis",
    position: { x: 50, y: 280 },
    data: {
      title: "PROMPT TITLE",
      showImage: false,
      category: "text",
      content: `Create a cinematic close-up shot of a vintage poem page with subtle lighting highlighting the texture of the paper. The scene should evoke a sense of nostalgia and intimacy, with muted tones and soft shadows.`,
    },
    style: {
      width: 260,
    },
  },
  {
    id: "2",
    type: "image",
    position: { x: 450, y: 30 },
    data: {
      title: "CLOSE-UP OF A TEXTURED POEM PAGE, DIM...",
      showImage: true,
      category: "image",
      caption: "Intimate poetry close-up",
      seed: "416838458",
      content: `**"Shot Type":** Close-up
**"Composition":** Focus on a textured surface or 
open pages of a book/poem, with significant 
negative space around the edges.
**"Color Palette":** Dominated by dark, muted 
tones (deep blues, grays, and blacks) with subtle 
lighting highlighting textures and edges for an 
artistic effect.`,
    },
    style: {
      width: 280,
    },
  },
  {
    id: "3",
    type: "video",
    position: { x: 450, y: 430 },
    data: {
      title: "TRAIN CONVERSATION SCENE",
      showImage: true,
      category: "video",
      caption: "It is the z aileen are for by teapuit he upsh it bill",
      seed: "789012345",
      modelId: "wan-pro",
      modelSettings: {
        resolution: "720p",
        duration_seconds: 4,
        frame_rate: 30,
        motion_intensity: "medium",
      },
      content: `Focus on the over-the-shoulder shot of 
characters. Emphasize the intimate group 
setting within the confined train setting, 
highlighting conversations and body language to 
convey connection and engagement. Realistic 
and cinematic shot.`,
      // Use a memoized callback to prevent unnecessary re-renders
      onModelChange: (modelId, settings) => {
        // Only log changes, don't update state here
        console.log("Model changed:", modelId, settings)
      },
    },
    style: {
      width: 280,
    },
  },
]

/**
 * Initial edges for the canvas
 */
const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#444", strokeWidth: 1 },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    animated: true,
    style: { stroke: "#444", strokeWidth: 1 },
  },
]

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
  const { project, fitView } = useReactFlow()

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
   * Handle connection between nodes
   */
  const handleConnect = useCallback(
    (params) => {
      // Only allow connections from prompt nodes to image/video nodes
      const sourceNode = nodes.find((node) => node.id === params.source)
      const targetNode = nodes.find((node) => node.id === params.target)

      if (sourceNode?.type === "analysis" && (targetNode?.type === "image" || targetNode?.type === "video")) {
        // Save current state before connecting
        saveState()

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
    },
    [nodes, saveState, setNodes, setEdges],
  )

  /**
   * Handle connection start for showing context menu when dragging to empty canvas
   */
  const handleConnectStart = useCallback(
    (event, { nodeId, handleType }) => {
      // Only track source connections from prompt nodes
      const sourceNode = nodes.find((node) => node.id === nodeId)
      if (handleType === "source" && sourceNode?.type === "analysis") {
        setSelectedNodeId(nodeId)
      } else {
        setSelectedNodeId(null) // Reset if not a valid source
      }
    },
    [nodes, setSelectedNodeId],
  )

  /**
   * Handle connection end for showing context menu when dragging to empty canvas
   */
  const handleConnectEnd = useCallback(
    (event) => {
      if (!selectedNodeId) return

      // Get the target element
      const targetElement = event.target

      // Check if we're dropping on the canvas (not on a node)
      const targetIsPane =
        targetElement.classList.contains("react-flow__pane") ||
        targetElement.classList.contains("react-flow__renderer") ||
        targetElement.classList.contains("react-flow__background")

      if (targetIsPane && selectedNodeId) {
        // Get the position of the mouse
        const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect()
        if (canvasBounds) {
          // Show context menu at the drop position with the source node ID
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            sourceNodeId: selectedNodeId,
          })
        }
      }
    },
    [selectedNodeId, setContextMenu],
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
      type: "analysis" | "image" | "video" | "image-to-image",
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
                  : type === "image"
                    ? "IMAGE TITLE"
                    : type === "image-to-image"
                      ? "IMAGE-TO-IMAGE TITLE"
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
            if (type === "image" || type === "video" || type === "image-to-image") {
              const sourceNode = nodes.find((node) => node.id === contextMenu.sourceNodeId)

              // Create the edge
              const newEdge = {
                id: `e${contextMenu.sourceNodeId}-${newNodeId}`,
                source: contextMenu.sourceNodeId,
                target: newNodeId,
                animated: true,
                style: { stroke: "#444", strokeWidth: 1 },
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
                const width = img.width
                const height = img.height
                const aspectRatio = width / height

                // Check if the aspect ratio matches any of our predefined ratios
                const isStandardRatio =
                  Math.abs(aspectRatio - 16 / 9) < 0.1 ||
                  Math.abs(aspectRatio - 9 / 16) < 0.1 ||
                  Math.abs(aspectRatio - 1) < 0.1

                if (isStandardRatio) {
                  // If it's a standard ratio, create the node directly
                  saveState() // Save current state before adding a new node

                  const newNodeId = `video_${Date.now()}`
                  const newNode = {
                    id: newNodeId,
                    type: "video",
                    position: project(position),
                    data: {
                      title: "DROPPED IMAGE",
                      showImage: true,
                      category: "video",
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
                } else {
                  // If it's not a standard ratio, show the crop tool
                  setCropImage({
                    file,
                    dataUrl,
                    position: project(position),
                  })
                }
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
    [project, saveState, setNodes, addImage, setCropImage],
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

  return (
    <div className="h-screen w-full flex flex-col bg-black font-mono">
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

