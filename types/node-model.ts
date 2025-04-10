// Define the node model types that determine behavior

export type NodeCategory =
  | "text"
  | "image"
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "render"

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
      modelId: "wan-pro",
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
      modelId: "wan-pro",
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
  // Get the rules for both node types
  const sourceRules = NODE_MODELS[sourceNodeType]?.rules
  const targetRules = NODE_MODELS[targetNodeType]?.rules

  // If either node type doesn't exist in our model, the connection is invalid
  if (!sourceRules || !targetRules) return false

  // Text output to text input
  if (sourceRules.outputsText && targetRules.acceptsTextInput && (!targetHandle || targetHandle === "text")) {
    return true
  }

  // Image output to image input
  if (sourceRules.outputsImage && targetRules.acceptsImageInput && (!targetHandle || targetHandle === "image")) {
    return true
  }

  // If we get here, the connection is invalid
  return false
}

