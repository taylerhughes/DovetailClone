import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("font-type-body text-foreground", {
  variants: {
    size: {
      50:   "text-fs-50  leading-type-snug",
      75:   "text-fs-75  leading-type-snug",
      100:  "text-fs-100 leading-type-normal",
      200:  "text-fs-200 leading-type-normal",
      300:  "text-fs-300 leading-type-normal",
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
    family: {
      satoshi: "font-type-body",
      sans:    "font-sans",
    },
  },
  defaultVariants: {
    size:   100,
    weight: "regular",
    color:  "default",
    family: "satoshi",
  },
})

type TextAs = "p" | "span" | "div" | "label" | "li" | "dt" | "dd" | "figcaption"

export interface TextProps extends VariantProps<typeof textVariants> {
  as?: TextAs
  className?: string
  children: React.ReactNode
}

export function Text({ as: Tag = "p", size, weight, color, family, className, children }: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, weight, color, family }), className)}>
      {children}
    </Tag>
  )
}
