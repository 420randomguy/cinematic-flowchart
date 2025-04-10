import { createLazyComponent } from "./code-splitting"
import { memo } from 'react'

// Lazy load node components with memoization outside of any component
const TextNode = memo(createLazyComponent(() => import("@/components/nodes/TextNode")))
const ImageNode = memo(createLazyComponent(() => import("@/components/nodes/ImageNode")))
const ImageToVideoNode = memo(createLazyComponent(() => import("@/components/nodes/ImageToVideoNode")))
const TextToVideoNode = memo(createLazyComponent(() => import("@/components/nodes/TextToVideoNode")))
const TextToImageNode = memo(createLazyComponent(() => import("@/components/nodes/TextToImageNode")))
const ImageToImageNode = memo(createLazyComponent(() => import("@/components/nodes/ImageToImageNode")))
const RenderNode = memo(createLazyComponent(() => import("@/components/nodes/RenderNode")))

// Export node types as a stable object reference that won't change between renders
// Define this outside of any component or function to ensure it's only created once
export const nodeTypes = Object.freeze({
  // Input Nodes
  text: TextNode,
  image: ImageNode,

  // Output Nodes
  "image-to-video": ImageToVideoNode,
  "text-to-video": TextToVideoNode,
  "text-to-image": TextToImageNode,
  "image-to-image": ImageToImageNode,
  
  // Render Node
  "render": RenderNode,
})

// Preload all node types when the browser is idle
export function preloadAllNodeTypes() {
  Object.values(nodeTypes).forEach((component: any) => {
    if (typeof component.preload === "function") {
      component.preload()
    }
  })
}

