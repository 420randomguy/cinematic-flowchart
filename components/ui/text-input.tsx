"use client"

import type React from "react"

import { useRef, useEffect, forwardRef, useState } from "react"
import { createInputProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxChars?: number
  className?: string
}

const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(
  ({ value, onChange, placeholder = "Enter your prompt here...", maxChars = 4000, className = "" }, ref) => {
    // Use the store directly
    const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
    const inputProps = createInputProps(handleInputInteraction)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [text, setText] = useState(value || "")

    // Auto-resize textarea based on content
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [text])

    // Handle text change
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      if (newText.length <= maxChars) {
        setText(newText)
        onChange(newText)
      }
    }

    return (
      <div className={`border-t border-b border-gray-800/50 py-1.5 my-0.5 relative ${className}`}>
        <div className="relative">
          <textarea
            ref={textareaRef || ref}
            value={text}
            onChange={handleTextChange}
            className="w-full min-h-[60px] bg-black text-[9px] text-gray-300 p-1.5 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 overflow-hidden prevent-node-drag"
            placeholder={placeholder}
            style={{ height: "auto" }}
            {...inputProps}
          />
          <div className="absolute bottom-1 right-1 text-[8px] text-gray-500">
            {text.length}/{maxChars}
          </div>
        </div>
      </div>
    )
  },
)

TextInput.displayName = "TextInput"

export { TextInput }

