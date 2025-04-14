"use client"

import { memo, useRef, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInteractiveProps } from "@/lib/utils/node-interaction"
import { useFlowchartStore } from "@/store/useFlowchartStore"
import ModelSelector from "@/components/ui/ModelSelector"
import type { NodeSettingsProps } from "@/types/node-props"
import { useMemoization } from "@/hooks/useMemoization"
import { Input } from "@/components/ui/input"
import { SettingTooltip } from "@/components/ui/setting-tooltip"
import { Plus } from "lucide-react"

// Add the NegativePromptInput component
const NegativePromptInput = ({ 
  value, 
  onChange, 
  maxChars = 200
}: { 
  value: string; 
  onChange: (value: string) => void;
  maxChars?: number;
}) => {
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)
  
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
    <div className="pt-2">
      <div className="flex items-center mb-1">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">
          NEGATIVE PROMPT
          <SettingTooltip description="Specify what to avoid in the generation" />
        </div>
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          className="w-full min-h-[40px] bg-gray-900/30 border border-gray-800 text-[9px] text-gray-300 p-1.5 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-700 overflow-y-hidden"
          placeholder="low quality, bad anatomy, blurry, pixelated..."
          spellCheck="false"
          {...interactiveProps}
        />
        <div className="absolute bottom-1 right-1 text-[8px] text-gray-500">
          {text.length}/{maxChars}
        </div>
      </div>
    </div>
  )
}

// Add new LoraModelURLs component
const LoraModelURLs = ({ 
  urls = [], 
  onChange 
}: { 
  urls: string[]; 
  onChange: (urls: string[]) => void;
}) => {
  const handleInputInteraction = useFlowchartStore((state) => state.handleInputInteraction)
  const interactiveProps = createInteractiveProps(handleInputInteraction)
  
  // Local state to track URLs for rendering
  const [localUrls, setLocalUrls] = useState<string[]>(urls.length > 0 ? urls : ['']);
  
  // Update local state when props change
  useEffect(() => {
    console.log("LoraModelURLs received new urls prop:", urls);
    // Only update if actually different to avoid loops
    if (JSON.stringify(localUrls) !== JSON.stringify(urls)) {
      setLocalUrls(urls.length > 0 ? [...urls] : ['']);
    }
  }, [urls]);
  
  // Update an individual URL
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...localUrls];
    newUrls[index] = value;
    setLocalUrls(newUrls);
    onChange(newUrls);
  };
  
  // Add a new empty URL field
  const handleAddUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Create new array with added empty string
    const newUrls = [...localUrls, ''];
    console.log("Adding new URL field, new array:", newUrls);
    
    // Update both local state and parent
    setLocalUrls(newUrls);
    onChange(newUrls);
  };

  // Remove a URL field at a specific index
  const removeUrlField = (index: number) => {
    const newUrls = [...localUrls];
    newUrls.splice(index, 1);
    
    // Ensure we always have at least one field
    const finalUrls = newUrls.length > 0 ? newUrls : [''];
    
    setLocalUrls(finalUrls);
    onChange(finalUrls);
  };
  
  console.log("LoraModelURLs rendering with localUrls:", localUrls);
  
  return (
    <div className="pt-2">
      <div className="flex items-center mb-1">
        <div className="text-[9px] uppercase text-gray-500 tracking-wide">
          LORA MODEL URLS
          <SettingTooltip description="Add Lora model URLs to use with this generation" />
        </div>
      </div>
      <div className="space-y-2">
        {localUrls.map((url, index) => (
          <div key={`url-${index}-${url}`} className="flex items-center space-x-1">
            <Input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              onFocus={() => handleInputInteraction(true)}
              onBlur={() => handleInputInteraction(false)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-5 w-full bg-gray-800/30 border-gray-800 text-[9px] text-gray-300 rounded-sm px-2 py-0 font-mono focus:ring-0 focus:outline-none focus:border-gray-700 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="https://civitai.com/models/..."
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeUrlField(index);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center text-[9px] text-gray-400 hover:text-gray-300 px-1"
            >
              [-]
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center space-x-1 text-[9px] text-gray-400 hover:text-gray-300"
          onClick={handleAddUrl}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Plus className="w-3 h-3" />
          <span>Add URL</span>
        </button>
      </div>
    </div>
  );
};

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
  negativePrompt = "",
  onNegativePromptChange,
  loraUrls = [],
  onLoraUrlsChange,
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

      {/* Lora Model URLs Input - MOVED ABOVE Negative Prompt Input */}
      {onLoraUrlsChange && (
        <LoraModelURLs 
          urls={loraUrls} 
          onChange={onLoraUrlsChange} 
        />
      )}

      {/* Negative Prompt Input */}
      {onNegativePromptChange && (
        <NegativePromptInput 
          value={negativePrompt} 
          onChange={onNegativePromptChange} 
        />
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

