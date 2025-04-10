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
  
  // Merge new content with existing content instead of replacing it
  showContent: (nodeId, content) => set(state => ({
    visibleContent: {
      ...state.visibleContent,
      [nodeId]: {
        ...state.visibleContent[nodeId], // Keep existing content
        ...content // Merge with new content
      }
    }
  })),
  
  clearContent: (nodeId) => set(state => {
    const newContent = {...state.visibleContent}
    delete newContent[nodeId]
    return { visibleContent: newContent }
  })
})) 