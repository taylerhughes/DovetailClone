import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "rounded-full flex items-center justify-center shrink-0 select-none",
  {
    variants: {
      size: {
        sm: "size-6",
        md: "size-8",
        lg: "size-10",
      },
      color: {
        zinc: "bg-zinc-300",
      },
    },
    defaultVariants: {
      size: "sm",
      color: "zinc",
    },
  }
)

const initialsVariants = cva("font-type-body font-bold leading-none", {
  variants: {
    size: {
      sm: "text-fs-50 text-zinc-600",
      md: "text-fs-75 text-zinc-600",
      lg: "text-fs-100 text-zinc-600",
    },
  },
  defaultVariants: { size: "sm" },
})

export interface AvatarPrimitiveProps extends VariantProps<typeof avatarVariants> {
  initials?: string
  className?: string
}

export function AvatarPrimitive({ initials, size, color, className }: AvatarPrimitiveProps) {
  return (
    <div className={cn(avatarVariants({ size, color }), className)}>
      {initials && (
        <span className={initialsVariants({ size })}>
          {initials}
        </span>
      )}
    </div>
  )
}
