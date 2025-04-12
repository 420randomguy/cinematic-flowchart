import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { type Edge, type Node, applyEdgeChanges, applyNodeChanges, type Connection, addEdge } from "reactflow"
import type { RefObject } from 'react'
import { getSourceHandle } from "@/types/node-model"
import { useVisualMirrorStore } from '@/store/useVisualMirrorStore'

// Add a helper function for deep cloning at the top of the file, after imports
// Efficient deep clone function that handles circular references better than JSON methods
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle array cloning
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // Handle object cloning
  const clone = {} as any;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  
  return clone;
}

interface HistoryState {
  nodes: Node[]
  edges: Edge[]
}

interface FlowchartState {
  // Core state
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  isDragging: boolean
  isInteractingWithInput: boolean
  canvasContainerRef: RefObject<HTMLDivElement> | null

  // History state (undo/redo)
  undoStack: HistoryState[]
  redoStack: HistoryState[]
  isUndoRedoing: boolean

  // Context menu state
  contextMenu: { x: number; y: number; sourceNodeId?: string } | null

  // Clipboard state
  clipboard: { type: string; data: any; style: any } | null

  // Connection state
  connectionStartNodeId: string | null
  connectionStartHandleType: string | null
  connectionStartHandleId: string | null

  // Image crop state
  cropImage: { file: File; dataUrl: string; position: { x: number; y: number }; nodeId?: string } | null

  // Data propagation
  propagateNodeData: (sourceNode: Node, targetNode: Node, targetHandle: string | null | undefined) => { targetNode: Node, didUpdate: boolean }
  clearNodeData: (targetNode: Node, sourceNodeType: string | undefined, targetHandle: string | null | undefined) => { targetNode: Node, didUpdate: boolean }

  // Node operations
  duplicateNode: (nodeId: string) => void
  deleteNode: (nodeId: string) => void
  
  // Node state management
  updateNodeQuality: (nodeId: string, quality: number) => void
  updateNodeStrength: (nodeId: string, strength: number) => void
  updateNodeModel: (nodeId: string, modelId: string) => void
  updateNodeModelSettings: (nodeId: string, settings: Record<string, any>) => void
  updateNodeContent: (nodeId: string, content: string) => void
  updateNodeImage: (nodeId: string, imageUrl: string) => void
  
  // Actions
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  onNodesChange: (changes: any[]) => void
  onEdgesChange: (changes: any[]) => void
  onConnect: (connection: Connection) => void
  setSelectedNodeId: (id: string | null) => void
  setIsDragging: (isDragging: boolean) => void
  setIsInteractingWithInput: (isInteracting: boolean) => void
  handleInputInteraction: (isInteracting?: boolean) => void
  setContextMenu: (contextMenu: { x: number; y: number; sourceNodeId?: string } | null) => void
  setClipboard: (clipboard: { type: string; data: any; style: any } | null) => void
  setConnectionStartNodeId: (id: string | null) => void
  setConnectionStartHandleType: (type: string | null) => void
  setConnectionStartHandleId: (id: string | null) => void
  setCropImage: (
    cropImage: { file: File; dataUrl: string; position: { x: number; y: number }; nodeId?: string } | null,
  ) => void
  saveState: () => void
  undo: () => void
  redo: () => void
  clearContextMenu: () => void
  setCanvasContainerRef: (ref: RefObject<HTMLDivElement> | null) => void

  // New function to create a render node
  createRenderNode: (sourceNodeId: string, requestId?: string) => string
}

export const useFlowchartStore = create<FlowchartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        nodes: [],
        edges: [],
        selectedNodeId: null,
        isDragging: false,
        isInteractingWithInput: false,
        undoStack: [],
        redoStack: [],
        isUndoRedoing: false,
        contextMenu: null,
        clipboard: null,
        connectionStartNodeId: null,
        connectionStartHandleType: null,
        connectionStartHandleId: null,
        cropImage: null,
        canvasContainerRef: null,

        // Data propagation functions
        propagateNodeData: (sourceNode, targetNode, targetHandle) => {
          const newData = { ...targetNode.data }; // Clone data
          let didUpdate = false;

          // Get the source node type and data
          const sourceNodeType = sourceNode.type as string;
          const sourceNodeData = sourceNode.data || {};

          // Handle source node content propagation
          const isImageSource = sourceNodeType === "image" || sourceNodeType === "text-to-image" || sourceNodeType === "image-to-image";
          const isTextSource = sourceNodeType === "text";
          const isVideoSource = sourceNodeType === "text-to-video" || sourceNodeType === "image-to-video";

          // Special case for Render nodes - they need both image and text data
          if (targetNode.type === "render") {
            console.log(`[FlowchartStore] Propagating data to render node ${targetNode.id} from ${sourceNodeType}`);
            console.log(`[FlowchartStore] Source node data:`, sourceNodeData);
            
            // For image sources, propagate image URL
            if (isImageSource && sourceNodeData.imageUrl) {
              console.log(`[FlowchartStore] Propagating image to render: ${sourceNodeData.imageUrl}`);
              newData.sourceImageUrl = sourceNodeData.imageUrl;
              didUpdate = true;
            }
            
            // For text sources, propagate text content  
            if (isTextSource && sourceNodeData.content) {
              console.log(`[FlowchartStore] Propagating text to render: ${sourceNodeData.content}`);
              newData.sourceNodeContent = sourceNodeData.content;
              didUpdate = true;
            }
            
            // For video sources, propagate video URL
            if (isVideoSource && sourceNodeData.videoUrl) {
              console.log(`[FlowchartStore] Propagating video to render: ${sourceNodeData.videoUrl}`);
              newData.sourceVideoUrl = sourceNodeData.videoUrl;
              didUpdate = true;
            }
            
            console.log(`[FlowchartStore] Updated render node data:`, newData);
            
            return {
              targetNode: { ...targetNode, data: newData },
              didUpdate
            };
          }

          // Original propagation logic for other nodes
          if (isImageSource && targetHandle === 'image') {
            newData.sourceImageUrl = sourceNodeData.imageUrl || null;
            didUpdate = true;
          } else if (isTextSource && targetHandle === 'text') {
            newData.sourceNodeContent = sourceNodeData.content || null;
            didUpdate = true;
          }

          return {
            targetNode: { ...targetNode, data: newData },
            didUpdate
          };
        },

        clearNodeData: (targetNode, sourceNodeType, targetHandle) => {
          const newData = { ...targetNode.data }; // Clone data
          let didUpdate = false;

          const isImageSource = sourceNodeType === "image" || sourceNodeType === "text-to-image" || sourceNodeType === "image-to-image";
          const isTextSource = sourceNodeType === "text";

          if (isImageSource && targetHandle === 'image') {
            newData.sourceImageUrl = null;
            didUpdate = true;
          } else if (isTextSource && targetHandle === 'text') {
            newData.sourceNodeContent = null;
            didUpdate = true;
          } else if (!sourceNodeType) {
            // If source node type is unknown, clear both potentially
            if (targetHandle === 'image') {
              newData.sourceImageUrl = null;
              didUpdate = true;
            }
            if (targetHandle === 'text') {
              newData.sourceNodeContent = null;
              didUpdate = true;
            }
          }

          return {
            targetNode: { ...targetNode, data: newData },
            didUpdate
          };
        },

        // Node operations
        duplicateNode: (nodeId) => {
          const node = get().nodes.find(node => node.id === nodeId);
          if (!node) return;

          // Save state before operation
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }

          // Generate a new unique ID
          const newNodeId = `${node.type}_${Date.now()}`;
          
          // Create slightly offset position
          const newPosition = {
            x: node.position.x + 20,
            y: node.position.y + 20,
          };

          // Create the new node
          const newNode = {
            ...node,
            id: newNodeId,
            position: newPosition,
            data: {
              ...node.data,
              isNewNode: true,
            },
            selected: true
          };

          // Update the nodes array
          set((state) => ({
            nodes: [
              ...state.nodes.map(n => ({
                ...n,
                selected: false, // Deselect all other nodes
                style: {
                  ...n.style,
                  filter: undefined, // Remove selection glow
                }
              })),
              newNode,
            ],
            selectedNodeId: newNodeId, // Set the new node as selected
          }));

          console.log(`[Store] Duplicated node ${nodeId} -> ${newNodeId}`);
        },

        deleteNode: (nodeId) => {
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }

          // Remove the node
          set((state) => ({
            nodes: state.nodes.filter(node => node.id !== nodeId),
            // Also remove any edges connected to this node
            edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
          }));
          
          console.log(`[Store] Deleted node ${nodeId}`);
        },

        // Node state management functions
        updateNodeQuality: (nodeId, quality) => {
          set((state) => ({
            nodes: state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, quality } } 
                : node
            )
          }));
        },
        
        updateNodeStrength: (nodeId, strength) => {
          set((state) => ({
            nodes: state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, strength } } 
                : node
            )
          }));
        },
        
        updateNodeModel: (nodeId, modelId) => {
          console.log(`[FlowchartStore] Updating node ${nodeId} model to: ${modelId}`);
          
          // Save state before making the change 
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }
          
          set((state) => {
            // Find the node to check if it exists and get its type
            const node = state.nodes.find(n => n.id === nodeId);
            if (!node) {
              console.warn(`[FlowchartStore] Node ${nodeId} not found when updating model`);
              return state; // Return unchanged state
            }
            
            console.log(`[FlowchartStore] Node ${nodeId} (${node.type}) model updated from ${node.data?.modelId || 'none'} to ${modelId}`);
            
            // Update the node's model ID
            return {
              nodes: state.nodes.map(node => 
                node.id === nodeId 
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        modelId,
                        _lastModelUpdate: Date.now(), // Add timestamp to force re-renders
                      } 
                    } 
                  : node
              )
            };
          });
        },
        
        updateNodeModelSettings: (nodeId, modelSettings) => {
          set((state) => ({
            nodes: state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, modelSettings } } 
                : node
            )
          }));
        },
        
        updateNodeContent: (nodeId, content) => {
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }

          // Update the node content
          set((state) => {
            // First update the source node
            const updatedNodes = state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, content } } 
                : node
            );
            
            // Then propagate to all target nodes
            const targetNodeIds = state.edges
              .filter(edge => edge.source === nodeId && edge.sourceHandle === 'text')
              .map(edge => edge.target);
              
            return {
              nodes: updatedNodes.map(node => {
                if (targetNodeIds.includes(node.id)) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      _lastUpdated: Date.now()
                    }
                  };
                }
                return node;
              })
            };
          });
        },
        
        updateNodeImage: (nodeId, imageUrl) => {
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }

          // Update the node image
          set((state) => {
            // First update the source node
            const updatedNodes = state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, imageUrl } } 
                : node
            );
            
            // Then propagate to all target nodes
            // First, find all edges that start from our source node
            const relevantEdges = state.edges.filter(edge => edge.source === nodeId && edge.sourceHandle === 'image');
            
            const targetNodeIds = relevantEdges.map(edge => edge.target);
            
            // Update the target nodes with the new image URL
            const finalNodes = updatedNodes.map(node => {
              if (targetNodeIds.includes(node.id)) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    sourceImageUrl: imageUrl,
                    _lastUpdated: Date.now()
                  }
                };
              }
              return node;
            });
              
            return {
              nodes: finalNodes
            };
          });
        },

        // Actions
        setNodes: (nodes) =>
          set((state) => ({
            nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
          })),

        setEdges: (edges) =>
          set((state) => ({
            edges: typeof edges === "function" ? edges(state.edges) : edges,
          })),

        onNodesChange: (changes) => {
          const { isUndoRedoing } = get()

          // If we're removing nodes, save the current state first
          if (!isUndoRedoing && changes.some((change) => change.type === "remove")) {
            get().saveState()
          }

          set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes).map((node) => {
              if (node.selected) {
                // Update selectedNodeId state
                set({ selectedNodeId: node.id })
                // Return node without changing style - we handle this with CSS now
                return node
              } else {
                // No style changes needed for unselected nodes
                return node
              }
            }),
          }))
        },

        onEdgesChange: (changes) => {
          const { isUndoRedoing } = get()

          // If we're removing edges, save the current state first
          if (!isUndoRedoing && changes.some((change) => change.type === "remove")) {
            get().saveState()
          }

          set((state) => {
            // Get the state before applying changes to find removed edges info
            const originalEdges = state.edges;
            const updatedEdges = applyEdgeChanges(changes, originalEdges);
            let updatedNodes = [...state.nodes]; // Start with current nodes

            // Handle edge removals to clear target node data
            changes.forEach((change) => {
              if (change.type === 'remove') {
                const removedEdge = originalEdges.find(edge => edge.id === change.id);
                if (removedEdge) {
                  const targetNodeIndex = updatedNodes.findIndex(n => n.id === removedEdge.target);
                  if (targetNodeIndex !== -1) {
                    const sourceNode = updatedNodes.find(n => n.id === removedEdge.source);
                    const targetNode = updatedNodes[targetNodeIndex];
                    
                    // Use imported store
                    const { clearContent } = useVisualMirrorStore.getState();
                    
                    // Clear content from VisualMirrorStore for the target node
                    clearContent(removedEdge.target);
                    
                    const { targetNode: updatedTargetNode, didUpdate } = get().clearNodeData(
                      targetNode, 
                      sourceNode?.type, 
                      removedEdge.targetHandle
                    );
                    
                    if (didUpdate) {
                      updatedNodes[targetNodeIndex] = updatedTargetNode;
                    }
                  }
                }
              }
            });

            return {
              edges: updatedEdges,
              nodes: updatedNodes, // Return the nodes possibly updated by edge removal
            };
          })
        },

        onConnect: (connection) => {
          // Added saveState here before adding edge and propagating data
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
             get().saveState();
          }

          set((state) => {
            const sourceNode = state.nodes.find(n => n.id === connection.source);
            const targetNodeIndex = state.nodes.findIndex(n => n.id === connection.target);
            let updatedNodes = [...state.nodes]; // Clone nodes array
            let updatedEdges = [...state.edges]; // Clone edges array

            if (sourceNode && targetNodeIndex !== -1) {
              const targetNode = updatedNodes[targetNodeIndex];
              
              // Special handling for render nodes to ensure proper connection
              if (targetNode.type === 'render') {
                // For render nodes, ensure we use the correct target handle based on source type
                if (!connection.targetHandle) {
                  const sourceType = sourceNode.type;
                  if (sourceType === 'text-to-video' || sourceType === 'image-to-video') {
                    connection.targetHandle = 'video';
                  } else {
                    connection.targetHandle = 'image';
                  }
                  
                  console.log(`[FlowchartStore] Auto-selecting targetHandle=${connection.targetHandle} for render node`);
                }
                
                // Force the render node to recognize it's connected by adding a timestamp
                updatedNodes[targetNodeIndex] = {
                  ...targetNode,
                  data: {
                    ...targetNode.data,
                    _connectedAt: Date.now(),
                    _isConnected: true  // Add an explicit connection flag
                  }
                };
              }
              
              // Find and remove any existing edges of the same type to this target
              const existingEdges = updatedEdges.filter(edge => 
                edge.target === connection.target && 
                edge.targetHandle === connection.targetHandle
              );
              
              if (existingEdges.length > 0) {
                // Remove existing edges
                const edgeIdsToRemove = existingEdges.map(edge => edge.id);
                updatedEdges = updatedEdges.filter(edge => !edgeIdsToRemove.includes(edge.id));
              }
              
              const { targetNode: updatedTargetNode, didUpdate } = get().propagateNodeData(
                sourceNode,
                targetNode,
                connection.targetHandle
              );
              
              if (didUpdate) {
                updatedNodes[targetNodeIndex] = updatedTargetNode;
              }
            }

            // Add the new edge
            updatedEdges = addEdge(connection, updatedEdges);

            return {
              edges: updatedEdges,
              nodes: updatedNodes, // Return nodes updated with propagated data
            };
          });
        },

        setSelectedNodeId: (id: string | null) => {
          // Update our store
          set({ selectedNodeId: id });
          
          // Use requestAnimationFrame to ensure this runs after the state update
          requestAnimationFrame(() => {
            // Get the ReactFlow instance
            try {
              // Find all nodes and update their selection state
              // This is done without a direct dependency on ReactFlow
              set((state) => ({
                nodes: state.nodes.map((node) => ({
                  ...node,
                  selected: node.id === id,
                  style: {
                    ...node.style,
                    filter: node.id === id ? "drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))" : undefined,
                  }
                }))
              }));
            } catch (error) {
              console.error("Error updating node selection:", error);
            }
          });
        },

        setIsDragging: (isDragging) => set({ isDragging }),

        setIsInteractingWithInput: (isInteracting) => set({ isInteractingWithInput: isInteracting }),

        handleInputInteraction: (isInteracting = false) => set({ isInteractingWithInput: isInteracting }),

        setContextMenu: (contextMenu) => set({ contextMenu }),

        setClipboard: (clipboard) => set({ clipboard }),

        setConnectionStartNodeId: (id) => set({ connectionStartNodeId: id }),

        setConnectionStartHandleType: (type) => set({ connectionStartHandleType: type }),

        setConnectionStartHandleId: (id) => set({ connectionStartHandleId: id }),

        setCropImage: (cropImage) => set({ cropImage }),

        saveState: () => {
          const { nodes, edges, isUndoRedoing } = get()
          if (isUndoRedoing) return

          set((state) => ({
            undoStack: [
              ...state.undoStack,
              {
                nodes: deepClone(nodes),
                edges: deepClone(edges),
              },
            ],
            redoStack: [], // Clear redo stack when a new action is performed
          }))
        },

        undo: () => {
          const { undoStack, nodes, edges } = get()
          if (undoStack.length === 0) return

          // Get the last state from the undo stack
          const prevState = undoStack[undoStack.length - 1]

          set({
            isUndoRedoing: true,
            // Save current state to redo stack
            redoStack: [
              { nodes: deepClone(nodes), edges: deepClone(edges) },
              ...get().redoStack,
            ],
            // Remove the last state from undo stack
            undoStack: undoStack.slice(0, -1),
            // Apply the previous state
            nodes: deepClone(prevState.nodes),
            edges: deepClone(prevState.edges),
          })

          // Reset the undo/redoing flag after a short delay
          setTimeout(() => set({ isUndoRedoing: false }), 50)
        },

        redo: () => {
          const { redoStack, nodes, edges } = get()
          if (redoStack.length === 0) return

          // Get the first state from the redo stack
          const nextState = redoStack[0]

          set({
            isUndoRedoing: true,
            // Save current state to undo stack
            undoStack: [
              ...get().undoStack,
              { nodes: deepClone(nodes), edges: deepClone(edges) },
            ],
            // Remove the first state from redo stack
            redoStack: redoStack.slice(1),
            // Apply the next state
            nodes: deepClone(nextState.nodes),
            edges: deepClone(nextState.edges),
          })

          // Reset the undo/redoing flag after a short delay
          setTimeout(() => set({ isUndoRedoing: false }), 50)
        },

        clearContextMenu: () => set({ contextMenu: null }),

        setCanvasContainerRef: (ref) => set({ canvasContainerRef: ref }),

        // Create a render node connected to the source node
        createRenderNode: (sourceNodeId: string, requestId?: string) => {
          // Get the source node
          const sourceNode = get().nodes.find(node => node.id === sourceNodeId);
          if (!sourceNode) return "";

          // Generate a new unique ID for the render node
          const newNodeId = `render_${Date.now()}`;
          
          // Calculate position for the render node (to the right of the source node)
          const newPosition = {
            x: sourceNode.position.x + 300,
            y: sourceNode.position.y,
          };
          
          // Get visual mirror content from the source node
          const sourceNodeData = sourceNode.data || {};
          
          // Create the new render node
          const newNode: Node = {
            id: newNodeId,
            type: "render",
            position: newPosition,
            data: {
              title: "Render",
              sourceNodeId: sourceNodeId,
              isNewNode: true,
              isSubmitted: true, // Automatically submit when created from button
              hasGenerated: false,
              requestId: requestId // Add the requestId to node data
            },
            selected: true
          };
          
          console.log(`[Store] Creating render node with data:`, newNode.data);
          
          // Create a new edge connecting the source node to the render node
          const sourceHandle = getSourceHandle(sourceNode.type as import("@/types/node-model").NodeCategory);
          
          // Make sure to use the correct target handle for the render node
          let targetHandle: string;
          
          // Simplified logic - use only "image" or "video" handles
          if (sourceHandle === "video" || sourceNode.type === "text-to-video" || sourceNode.type === "image-to-video") {
            targetHandle = "video"; // Video output goes to video target
          } else {
            // All other types go to image
            targetHandle = "image";
          }
          
          console.log(`[Store] Creating connection from ${sourceNode.type} (${sourceHandle}) to render node with targetHandle=${targetHandle}`);
          
          const newEdge: Edge = {
            id: `edge_${sourceNodeId}_${newNodeId}`,
            source: sourceNodeId,
            sourceHandle: sourceHandle,
            target: newNodeId,
            targetHandle: targetHandle,
          };
          
          // Save the current state before operation
          const { isUndoRedoing } = get();
          if (!isUndoRedoing) {
            get().saveState();
          }
          
          // Update state with the new node and edge
          set((state) => ({
            nodes: [
              ...state.nodes.map(n => ({
                ...n,
                selected: false, // Deselect all other nodes
              })),
              newNode,
            ],
            edges: [...state.edges, newEdge],
            selectedNodeId: newNodeId, // Set the new node as selected
          }));
          
          console.log(`[Store] Created render node ${newNodeId} connected to ${sourceNodeId}`);
          
          return newNodeId;
        },
      }),
      {
        name: "flowchart-storage",
        partialize: (state) => ({
          // Only persist minimal node data and edges
          nodes: state.nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            // Don't persist data that can be large
            data: {
              title: node.data?.title,
              category: node.data?.category,
              // Only save model ID, not full settings data
              modelId: node.data?.modelId,
              // Don't save image URLs or content
            },
          })),
          edges: state.edges,
          // Don't persist transient states
          selectedNodeId: null,
          contextMenu: null,
          isDragging: false,
          isInteractingWithInput: false,
          isUndoRedoing: false,
        }),
      },
    ),
  ),
)

