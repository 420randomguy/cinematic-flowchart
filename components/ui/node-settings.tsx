"use client"

import { memo, useRef, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import ModelSelector from "@/components/ui/ModelSelector"
import type { NodeSettingsProps } from "@/types/node-props"
import { useMemoization } from "@/hooks/useMemoization"
import { Input } from "@/components/ui/input"

/**
 * Reusable node settings component for quality, seed, strength, and model settings
 */
function NodeSettingsComponent({
  slider,
  setQuality,
  numbers,
  setNumbers,
  strength,
  setStrength,
  selectedModelId,
  modelSettings,
  handleModelChange,
  handleSettingsChange,
  data,
  showSizeSelector = true,
  defaultSize = "16:9",
  content,
  className = "",
}: NodeSettingsProps) {
  // Use the store directly
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)

  // Get the comparison function from the hook
  const { nodeSettingsComparison } = useMemoization()

  // Use refs to track previous values for memoization
  const prevSliderRef = useRef<number>(slider ?? 0)
  const prevStrengthRef = useRef(strength)
  const prevNumbersRef = useRef<string | number>(numbers ?? "")
  const prevModelIdRef = useRef(selectedModelId)
  
  // State for the numbers input field
  const [numbersInput, setNumbersInput] = useState<string>('')

  // Update local state when numbers prop changes
  useEffect(() => {
    if (numbers !== undefined && String(numbers) !== numbersInput) {
      setNumbersInput(String(numbers));
    }
  }, [numbers]);

  // Only update refs when values actually change
  if (slider !== prevSliderRef.current) prevSliderRef.current = slider ?? 0
  if (strength !== prevStrengthRef.current) prevStrengthRef.current = strength
  if (numbers !== prevNumbersRef.current) prevNumbersRef.current = numbers ?? ""
  if (selectedModelId !== prevModelIdRef.current) prevModelIdRef.current = selectedModelId

  // Handle numbers input change
  const handleNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty value (for deleting) and numeric values
    if (value === '' || /^\d*$/.test(value)) {
      setNumbersInput(value);
      
      // Update the parent component
      if (setNumbers) {
        setNumbers(value === '' ? '' : value);
      }
    }
  };

  // Handle numbers input blur
  const handleNumbersBlur = () => {
    handleInputInteraction(false);
    
    // If empty on blur, set to empty string
    if (numbersInput === '' && setNumbers) {
      setNumbers('');
    }
  };

  // Handle paste event for numbers input
  const handleNumbersPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    
    // Only allow numeric content to be pasted
    if (/^\d*$/.test(pastedText)) {
      // Let the default paste happen
    } else {
      // Prevent default paste for non-numeric content
      e.preventDefault();
    }
  };

  return (
    <div className={`space-y-1 pt-1 border-t border-gray-800/50 ${className}`}>
      {/* Section heading */}
      <div className="text-[9px] uppercase text-gray-500 tracking-wide font-bold mb-2">MODEL SETTINGS</div>

      {/* Numbers field */}
      <div className="flex justify-between items-center pt-1">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">NUMBERS</div>
        <Input
          type="text"
          value={numbersInput}
          onChange={handleNumbersChange}
          onBlur={handleNumbersBlur}
          onFocus={(e) => {
            handleInputInteraction(true);
          }}
          onPaste={handleNumbersPaste}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-5 w-24 bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0 font-mono text-right focus:ring-0 focus:outline-none focus:border-gray-700 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Selectdrop (formerly Size selector) */}
      {showSizeSelector && (
        <div className="flex justify-between items-center pt-1">
          <div className="text-[9px] uppercase text-gray-500 tracking-wide">SELECTDROP</div>
          <Select defaultValue={defaultSize || "16:9"} {...interactiveProps}>
            <SelectTrigger
              className="h-5 w-[60px] bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0 focus:ring-0 focus:outline-none focus:border-gray-700 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              {...interactiveProps}
            >
              <SelectValue placeholder={defaultSize || "16:9"} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-[9px] p-0 rounded-sm">
              <SelectItem value="16:9" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                16:9
              </SelectItem>
              <SelectItem value="9:16" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                9:16
              </SelectItem>
              <SelectItem value="3:4" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                3:4
              </SelectItem>
              <SelectItem value="4:3" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                4:3
              </SelectItem>
              <SelectItem value="1:1" className="text-[9px] py-1 px-2 text-gray-300" {...interactiveProps}>
                1:1
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Model settings */}
      {selectedModelId && handleModelChange && modelSettings && handleSettingsChange && data && (
        <ModelSelector
          selectedModelId={prevModelIdRef.current || ""}
          onModelChange={handleModelChange}
          settings={modelSettings}
          onSettingsChange={handleSettingsChange}
          className="pt-2"
          data={data}
        />
      )}
    </div>
  )
}

// Use our optimized memoization system
export const NodeSettings = memo(NodeSettingsComponent, (prevProps, nextProps) => {
  const { nodeSettingsComparison } = useMemoization()
  return nodeSettingsComparison(prevProps, nextProps)
})

