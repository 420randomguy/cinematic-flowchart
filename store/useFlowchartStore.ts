import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { type Edge, type Node, applyEdgeChanges, applyNodeChanges, type Connection, addEdge } from "reactflow"

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
            }),
          }))
        },

        onEdgesChange: (changes) => {
          const { isUndoRedoing, nodes } = get()

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
                    const newData = { ...targetNode.data }; // Clone data

                    if (sourceNode) {
                      const isImageSource = sourceNode.type === "image" || sourceNode.type === "text-to-image" || sourceNode.type === "image-to-image";
                      const isTextSource = sourceNode.type === "text" || sourceNode.type === "url";

                      if (isImageSource && removedEdge.targetHandle === 'image') {
                        newData.sourceImageUrl = null;
                        console.log(`[Store] Cleared sourceImageUrl on ${targetNode.id} due to edge removal from ${sourceNode.id}`);
                      } else if (isTextSource && removedEdge.targetHandle === 'text') {
                        newData.sourceNodeContent = null;
                        console.log(`[Store] Cleared sourceNodeContent on ${targetNode.id} due to edge removal from ${sourceNode.id}`);
                      }
                    } else {
                       // If source node not found (e.g., deleted simultaneously), clear both potentially
                       if (removedEdge.targetHandle === 'image') newData.sourceImageUrl = null;
                       if (removedEdge.targetHandle === 'text') newData.sourceNodeContent = null;
                       console.warn(`[Store] Source node ${removedEdge.source} not found during edge removal, clearing data on ${targetNode.id}`);
                    }

                    // Update the node immutably
                    updatedNodes[targetNodeIndex] = { ...targetNode, data: newData };
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

            if (sourceNode && targetNodeIndex !== -1) {
              const targetNode = updatedNodes[targetNodeIndex];
              const newData = { ...targetNode.data }; // Clone data object

              const isImageSource = sourceNode.type === "image" || sourceNode.type === "text-to-image" || sourceNode.type === "image-to-image";
              const isTextSource = sourceNode.type === "text" || sourceNode.type === "url";

              if (isImageSource && connection.targetHandle === 'image') {
                 // Replace existing image connection implicitly
                 newData.sourceImageUrl = sourceNode.data?.imageUrl || null;
                 console.log(`[Store] Propagated sourceImageUrl from ${sourceNode.id} to ${targetNode.id}`);
                 // Clear text if replacing with image
                 // newData.sourceNodeContent = null; // Optional: Decide if image connection should clear text
              } else if (isTextSource && connection.targetHandle === 'text') {
                 // Replace existing text connection implicitly
                 newData.sourceNodeContent = sourceNode.data?.content || '';
                 console.log(`[Store] Propagated sourceNodeContent from ${sourceNode.id} to ${targetNode.id}`);
                 // Clear image if replacing with text
                 // newData.sourceImageUrl = null; // Optional: Decide if text connection should clear image
              }

              // Update the target node immutably
              updatedNodes[targetNodeIndex] = { ...targetNode, data: newData };
            }

            // Add the new edge
            const updatedEdges = addEdge(connection, state.edges);

            return {
              edges: updatedEdges,
              nodes: updatedNodes, // Return nodes updated with propagated data
            };
          })
        },

        setSelectedNodeId: (id) => set({ selectedNodeId: id }),

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
                nodes: JSON.parse(JSON.stringify(nodes)),
                edges: JSON.parse(JSON.stringify(edges)),
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
              { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
              ...get().redoStack,
            ],
            // Remove the last state from undo stack
            undoStack: undoStack.slice(0, -1),
            // Apply the previous state
            nodes: JSON.parse(JSON.stringify(prevState.nodes)),
            edges: JSON.parse(JSON.stringify(prevState.edges)),
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
              { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
            ],
            // Remove the first state from redo stack
            redoStack: redoStack.slice(1),
            // Apply the next state
            nodes: JSON.parse(JSON.stringify(nextState.nodes)),
            edges: JSON.parse(JSON.stringify(nextState.edges)),
          })

          // Reset the undo/redoing flag after a short delay
          setTimeout(() => set({ isUndoRedoing: false }), 50)
        },

        clearContextMenu: () => set({ contextMenu: null }),
      }),
      {
        name: "flowchart-storage",
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          // Don't persist certain transient states
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

