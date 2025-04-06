/**
 * API integration for the flowchart application
 * This file provides a clean interface for backend integration
 */

// Generate a video from an image using the specified model
export async function generateVideo(
  modelId: string,
  imageUrl: string,
  settings: Record<string, any>,
): Promise<{ videoUrl: string; status: string }> {
  console.log(`Generating video with model ${modelId}`, {
    imageUrl,
    settings,
  })

  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        videoUrl: "/akira-animation.gif", // Mock video URL
        status: "success",
      })
    }, 3000)
  })
}

// Generate an image using the specified model
export async function generateImage(
  modelId: string,
  prompt: string,
  settings: Record<string, any>,
): Promise<{ imageUrl: string; status: string }> {
  console.log(`Generating image with model ${modelId}`, {
    prompt,
    settings,
  })

  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        imageUrl: "/sample-image.png", // Mock image URL
        status: "success",
      })
    }, 3000)
  })
}

// Get estimated generation time for a model with given settings
export function getEstimatedGenerationTime(modelId: string, settings: Record<string, any>): number {
  // Base time in seconds
  let baseTime = 15

  // Adjust based on resolution
  if (settings.resolution === "1080p") {
    baseTime += 10
  } else if (settings.resolution === "4K") {
    baseTime += 30
  }

  // Adjust based on duration
  if (settings.duration_seconds) {
    baseTime += settings.duration_seconds * 2
  }

  return baseTime
}

