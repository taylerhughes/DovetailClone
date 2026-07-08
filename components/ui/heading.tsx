import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export type HeadingSize = 50 | 75 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 | 1100 | 1200 | 1300
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export const LEVEL_DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: 1000,
  2: 800,
  3: 600,
  4: 400,
  5: 300,
  6: 200,
}

const headingVariants = cva("font-type-heading text-foreground", {
  variants: {
    size: {
      50:   "text-fs-50  leading-type-snug",
      75:   "text-fs-75  leading-type-snug",
      100:  "text-fs-100 leading-type-snug",
      200:  "text-fs-200 leading-type-snug",
      300:  "text-fs-300 leading-type-snug",
      400:  "text-fs-400 leading-type-snug",
      500:  "text-fs-500 leading-type-snug",
      600:  "text-fs-600 leading-type-snug",
      700:  "text-fs-700 leading-type-tight",
      800:  "text-fs-800 leading-type-tight",
      900:  "text-fs-900 leading-type-tight",
      1000: "text-fs-1000 leading-type-tight",
      1100: "text-fs-1100 leading-type-tight",
      1200: "text-fs-1200 leading-type-tight",
      1300: "text-fs-1300 leading-type-tight",
    },
    weight: {
      regular: "font-normal",
      medium:  "font-medium",
      bold:    "font-bold",
    },
    color: {
      default:  "text-foreground",
      subdued:  "text-muted-foreground",
      disabled: "text-muted-foreground opacity-50",
      inverse:  "text-primary-foreground",
    },
  },
  defaultVariants: {
    weight: "bold",
    color:  "default",
  },
})

export interface HeadingProps extends Omit<VariantProps<typeof headingVariants>, "size"> {
  level: HeadingLevel
  size?: HeadingSize
  className?: string
  children: React.ReactNode
}

export function Heading({ level, size, weight, color, className, children }: HeadingProps) {
  const Tag = `h${level}` as const
  const resolvedSize = size ?? LEVEL_DEFAULT_SIZE[level]
  return (
    <Tag className={cn(headingVariants({ size: resolvedSize, weight, color }), className)}>
      {children}
    </Tag>
  )
}
