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
          const { isUndoRedoing } = get()

          // If we're removing edges, save the current state first
          if (!isUndoRedoing && changes.some((change) => change.type === "remove")) {
            get().saveState()
          }

          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
          }))
        },

        onConnect: (connection) => {
          set((state) => ({
            edges: addEdge(connection, state.edges),
          }))
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

