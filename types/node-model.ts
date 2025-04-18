// Define the node model types that determine behavior

export type NodeCategory =
  | "text"
  | "image"
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "render"
  | "output"

// Define what inputs each node type accepts
export interface NodeConnectionRules {
  acceptsTextInput: boolean
  acceptsImageInput: boolean
  outputsText: boolean
  outputsImage: boolean
  outputsVideo: boolean
}

// Define the model configuration for each node type
export const NODE_MODELS: Record<
  NodeCategory,
  {
    title: string
    rules: NodeConnectionRules
    defaultSettings: Record<string, any>
  }
> = {
  text: {
    title: "TEXT",
    rules: {
      acceptsTextInput: false,
      acceptsImageInput: false,
      outputsText: true,
      outputsImage: false,
      outputsVideo: false,
    },
    defaultSettings: {},
  },
  image: {
    title: "IMAGE",
    rules: {
      acceptsTextInput: false,
      acceptsImageInput: false,
      outputsText: false,
      outputsImage: true,
      outputsVideo: false,
    },
    defaultSettings: {},
  },
  "text-to-image": {
    title: "TEXT-TO-IMAGE",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: false,
      outputsText: false,
      outputsImage: true,
      outputsVideo: false,
    },
    defaultSettings: {
      modelId: "flux-dev",
      quality: 80,
      seed: Math.floor(Math.random() * 1000000000).toString(),
    },
  },
  "image-to-image": {
    title: "IMAGE-TO-IMAGE",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: true,
      outputsText: false,
      outputsImage: true,
      outputsVideo: false,
    },
    defaultSettings: {
      modelId: "flux-dev",
      quality: 80,
      strength: 70,
      seed: Math.floor(Math.random() * 1000000000).toString(),
    },
  },
  "text-to-video": {
    title: "TEXT-TO-VIDEO",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: false,
      outputsText: false,
      outputsImage: false,
      outputsVideo: true,
    },
    defaultSettings: {
      modelId: "wan-2.1",
      quality: 80,
      seed: Math.floor(Math.random() * 1000000000).toString(),
    },
  },
  "image-to-video": {
    title: "IMAGE-TO-VIDEO",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: true,
      outputsText: false,
      outputsImage: false,
      outputsVideo: true,
    },
    defaultSettings: {
      modelId: "wan-2.1",
      quality: 80,
      seed: Math.floor(Math.random() * 1000000000).toString(),
    },
  },
  "render": {
    title: "RENDER",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: true,
      outputsText: false,
      outputsImage: false,
      outputsVideo: false,
    },
    defaultSettings: {},
  },
  "output": {
    title: "OUTPUT",
    rules: {
      acceptsTextInput: true,
      acceptsImageInput: true,
      outputsText: true,
      outputsImage: true,
      outputsVideo: true,
    },
    defaultSettings: {},
  },
}

// Helper function to get target handles for a node type
export function getTargetHandles(nodeType: NodeCategory): string[] {
  const handles: string[] = []
  const rules = NODE_MODELS[nodeType].rules

  if (rules.acceptsTextInput) handles.push("text")
  if (rules.acceptsImageInput) handles.push("image")

  return handles
}

// Helper function to get source handle for a node type
export function getSourceHandle(nodeType: NodeCategory): string {
  const rules = NODE_MODELS[nodeType].rules

  if (rules.outputsImage) return "image"
  if (rules.outputsText) return "text"
  if (rules.outputsVideo) return "video"

  return "output"
}

// Helper function to check if a connection is valid
export function isValidConnection(
  sourceNodeType: NodeCategory,
  targetNodeType: NodeCategory,
  sourceHandle?: string | null,
  targetHandle?: string | null,
): boolean {
  console.log(`Checking connection: ${sourceNodeType} -> ${targetNodeType} (sourceHandle: ${sourceHandle}, targetHandle: ${targetHandle})`)
  
  // Get the rules for both node types
  const sourceRules = NODE_MODELS[sourceNodeType]?.rules
  const targetRules = NODE_MODELS[targetNodeType]?.rules

  // If either node type doesn't exist in our model, the connection is invalid
  if (!sourceRules || !targetRules) return false

  // Special case for video nodes to render nodes - always allow these connections in either direction
  if ((sourceNodeType === "text-to-video" || sourceNodeType === "image-to-video") && 
      targetNodeType === "render") {
    console.log("✅ Valid: Video node -> Render node")
    return true
  }

  // Special case for render nodes to video nodes
  if (sourceNodeType === "render" && 
     (targetNodeType === "text-to-video" || targetNodeType === "image-to-video")) {
    console.log("✅ Valid: Render node -> Video node")
    return true
  }
  
  // Special case for Render node which can accept any output
  if (targetNodeType === "render") {
    // For image sources to image handle
    if ((sourceNodeType === "image" || sourceNodeType === "text-to-image" || sourceNodeType === "image-to-image") && 
        (!targetHandle || targetHandle === "image")) {
      console.log("✅ Valid: Image node -> Render node")
      return true
    }
    
    // Default case - accept any connection where target is render
    console.log("✅ Valid: Any -> Render (default case)")
    return true
  }

  // Text output to text input
  if (sourceRules.outputsText && targetRules.acceptsTextInput && (!targetHandle || targetHandle === "text")) {
    console.log("✅ Valid: Text output -> Text input")
    return true
  }

  // Image output to image input
  if (sourceRules.outputsImage && targetRules.acceptsImageInput && (!targetHandle || targetHandle === "image")) {
    console.log("✅ Valid: Image output -> Image input")
    return true
  }

  // Video output to video input (when target accepts video)
  if (sourceRules.outputsVideo && targetHandle === "video") {
    console.log("✅ Valid: Video output -> Video input")
    return true
  }

  // If we get here, the connection is invalid
  console.log("❌ Invalid connection")
  return false
}

