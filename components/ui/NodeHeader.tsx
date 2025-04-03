"use client"

interface NodeHeaderProps {
  title: string
  type: string
  modelId?: string
  onModelChange?: (modelId: string) => void
  className?: string
}

/**
 * Reusable node header component for displaying title and type
 */
export function NodeHeader({ title, type, modelId, onModelChange, className = "" }: NodeHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        {type.toUpperCase()}
      </div>

      {modelId && onModelChange && (
        <div className="absolute -top-2 right-2 z-20">
          <select
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0 appearance-none"
          >
            <option value="flux-dev">Flux Dev</option>
            <option value="wan-pro">WAN Pro</option>
            {/* Add more options as needed */}
          </select>
        </div>
      )}

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">{title}</div>
    </div>
  )
}

