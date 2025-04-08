import { createLazyComponent } from "./code-splitting"

// Lazy load node components
const TextNode = createLazyComponent(() => import("@/components/nodes/TextNode"))
const ImageNode = createLazyComponent(() => import("@/components/nodes/ImageNode"))
const ImageToVideoNode = createLazyComponent(() => import("@/components/nodes/ImageToVideoNode"))
const TextToVideoNode = createLazyComponent(() => import("@/components/nodes/TextToVideoNode"))
const TextToImageNode = createLazyComponent(() => import("@/components/nodes/TextToImageNode"))
const ImageToImageNode = createLazyComponent(() => import("@/components/nodes/ImageToImageNode"))

// Export node types
export const nodeTypes = {
  // Input Nodes
  text: TextNode,
  image: ImageNode,

  // Output Nodes
  "image-to-video": ImageToVideoNode,
  "text-to-video": TextToVideoNode,
  "text-to-image": TextToImageNode,
  "image-to-image": ImageToImageNode,
}

// Preload all node types when the browser is idle
export function preloadAllNodeTypes() {
  Object.values(nodeTypes).forEach((component: any) => {
    if (typeof component.preload === "function") {
      component.preload()
    }
  })
}

