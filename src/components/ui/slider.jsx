import React from "react"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef(({ className, value, onChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const handleChange = (e) => {
    const newValue = Number(e.target.value)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="relative flex w-full items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={{ direction: 'rtl' }}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }

