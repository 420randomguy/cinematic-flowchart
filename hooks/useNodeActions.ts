"use client"

import { useState, useCallback, useEffect } from "react"
import { useReactFlow } from "reactflow"

export interface NodeActionsOptions {
  id: string
  data: any
}

export function useNodeActions({ id, data }: NodeActionsOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5) // 5 seconds for testing
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isNewNode, setIsNewNode] = useState(false)

  // Get ReactFlow instance to manipulate nodes and edges
  const { getNode, getEdges, setNodes, setEdges } = useReactFlow()

  // Set animation class for new nodes
  useEffect(() => {
    if (data.isNewNode) {
      setIsNewNode(true)
      const timer = setTimeout(() => {
        setIsNewNode(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [data.isNewNode])

  // Auto-submit if flagged
  useEffect(() => {
    if (data.autoSubmit) {
      const timer = setTimeout(() => {
        handleSubmit()
        if (data.autoSubmit) {
          data.autoSubmit = false
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [data])

  // Function to create a new node based on the current one
  const createNewNode = useCallback(() => {
    const currentNode = getNode(id)
    if (!currentNode) return

    const incomingEdges = getEdges().filter((edge) => edge.target === id)
    if (incomingEdges.length === 0) return

    const sourceNodeId = incomingEdges[0].source

    // Create a new node ID
    const newNodeId = `${data.category}_${Date.now()}`

    // Calculate position to the right of current node
    const newPosition = {
      x: currentNode.position.x + 300,
      y: currentNode.position.y,
    }

    // Create a copy of the current node data
    const newNodeData = {
      ...data,
      title: `${data.title} (Copy)`,
      isNewNode: true,
      autoSubmit: true,
    }

    // Create the new node
    const newNode = {
      id: newNodeId,
      type: data.category,
      position: newPosition,
      data: newNodeData,
      style: { ...currentNode.style },
    }

    // Create a new edge connecting the prompt to the new node
    const newEdge = {
      id: `e${sourceNodeId}-${newNodeId}`,
      source: sourceNodeId,
      target: newNodeId,
      animated: true,
      style: { stroke: "#444", strokeWidth: 1 },
    }

    // Add the new node and edge
    setNodes((nodes) => [...nodes, newNode])
    setEdges((edges) => [...edges, newEdge])
  }, [id, data, getNode, getEdges, setNodes, setEdges])

  // Handle submission
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true)
    setShowResult(false)
    setIsGenerated(false)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          setTimerInterval(null)
          setIsSubmitting(false)
          setShowResult(true)
          setIsGenerated(true)
          return 5
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)
  }, [])

  // Handle submit button toggle
  const handleSubmitToggle = useCallback(() => {
    if (isSubmitting) {
      if (timerInterval) {
        clearInterval(timerInterval)
        setTimerInterval(null)
      }
      setIsSubmitting(false)
      setTimeRemaining(5)
      setShowResult(false)
    } else if (isGenerated) {
      createNewNode()
    } else {
      handleSubmit()
    }
  }, [isSubmitting, timerInterval, isGenerated, createNewNode, handleSubmit])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  return {
    isSubmitting,
    timeRemaining,
    showResult,
    isGenerated,
    isNewNode,
    handleSubmitToggle,
    createNewNode,
  }
}

