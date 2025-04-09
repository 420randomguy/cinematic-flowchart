import { create } from "zustand"

interface VisualContent {
  text?: string
  imageUrl?: string
}

interface VisualMirrorState {
  visibleContent: Record<string, VisualContent>
  showContent: (nodeId: string, content: VisualContent) => void
  clearContent: (nodeId: string) => void
}

export const useVisualMirrorStore = create<VisualMirrorState>((set) => ({
  visibleContent: {}, // nodeId -> { text, imageUrl }
  
  // Only update visuals when data is confirmed ready
  showContent: (nodeId, content) => set(state => ({
    visibleContent: {
      ...state.visibleContent,
      [nodeId]: content
    }
  })),
  
  clearContent: (nodeId) => set(state => {
    const newContent = {...state.visibleContent}
    delete newContent[nodeId]
    return { visibleContent: newContent }
  })
})) 