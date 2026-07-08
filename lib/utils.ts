import { extendTailwindMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          "text-fs": [
            "50", "75", "100", "200", "300", "400", "500",
            "600", "700", "800", "900", "1000", "1100", "1200", "1300",
          ],
        },
      ],
      "font-family": [{ "font-type": ["body", "heading"] }],
      leading: [{ "leading-type": ["tight", "snug", "normal", "relaxed"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
