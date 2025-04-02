"use client"

import { createContext, useContext } from "react"

type FlowchartContextType = {
  handleInputInteraction: (isInteracting?: boolean) => void
}

export const FlowchartContext = createContext<FlowchartContextType>({
  handleInputInteraction: () => {},
})

export const useFlowchart = () => useContext(FlowchartContext)

