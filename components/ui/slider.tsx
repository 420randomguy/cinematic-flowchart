"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    style={{ pointerEvents: 'auto' }}
    {...props}
  >
    <SliderPrimitive.Track 
      className="relative h-1 w-full grow overflow-hidden rounded-sm bg-black"
      style={{ pointerEvents: 'auto' }}
    >
      <SliderPrimitive.Range className="absolute h-full bg-gray-700" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-2 w-2 rounded-none border-0 bg-gray-700 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" 
      style={{ pointerEvents: 'auto', touchAction: 'none', cursor: 'pointer' }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

