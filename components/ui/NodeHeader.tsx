"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { NodeHeaderProps } from "@/types"
import { getVideoModels } from "@/lib/utils/schema-loader"

export function NodeHeader({ title, type, modelId, onModelChange }: NodeHeaderProps) {
  return (
    <>
      <div className="absolute -top-2 left-2 bg-gray-800 px-1.5 py-0.5 rounded-sm text-[8px] text-gray-300 uppercase tracking-wider">
        {type.toUpperCase()}
      </div>

      {(type === "image" || type === "video") && modelId && onModelChange && (
        <div className="absolute -top-2 right-2 z-20">
          <Select value={modelId} onValueChange={onModelChange}>
            <SelectTrigger className="h-5 w-[90px] bg-gray-800 border-0 text-[8px] text-gray-300 uppercase tracking-wider rounded-sm px-2 py-0">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-[9px] p-0 rounded-sm">
              {getVideoModels().map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="text-[8px] py-1 px-2 text-gray-300 uppercase tracking-wider"
                >
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="font-bold text-[10px] mb-0.5 text-gray-400 tracking-wide uppercase">{title}</div>
    </>
  )
}

