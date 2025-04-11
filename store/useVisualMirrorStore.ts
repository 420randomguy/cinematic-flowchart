import { create } from "zustand"

interface VisualContent {
  text?: string
  imageUrl?: string
  isGenerating?: boolean
  timeRemaining?: number
}

interface VisualMirrorState {
  visibleContent: Record<string, VisualContent>
  showContent: (nodeId: string, content: VisualContent) => void
  clearContent: (nodeId: string) => void
  startGeneration: (nodeId: string) => void
  updateGenerationTime: (nodeId: string, timeRemaining: number) => void
  completeGeneration: (nodeId: string, content: VisualContent) => void
}

export const useVisualMirrorStore = create<VisualMirrorState>((set) => ({
  visibleContent: {}, // nodeId -> { text, imageUrl, isGenerating, timeRemaining }
  
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
  }),

  // New functions for generation state management
  startGeneration: (nodeId) => set(state => ({
    visibleContent: {
      ...state.visibleContent,
      [nodeId]: {
        ...state.visibleContent[nodeId],
        isGenerating: true,
        timeRemaining: 5
      }
    }
  })),

  updateGenerationTime: (nodeId, timeRemaining) => set(state => ({
    visibleContent: {
      ...state.visibleContent,
      [nodeId]: {
        ...state.visibleContent[nodeId],
        timeRemaining
      }
    }
  })),

  completeGeneration: (nodeId, content) => set(state => ({
    visibleContent: {
      ...state.visibleContent,
      [nodeId]: {
        ...state.visibleContent[nodeId],
        ...content,
        isGenerating: false
      }
    }
  }))
})) 