import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-line/30 bg-noir-900/40 px-5 py-3 text-sm text-foreground shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-gold-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm theme-transition",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
