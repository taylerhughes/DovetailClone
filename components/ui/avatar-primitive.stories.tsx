import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AvatarPrimitive } from "./avatar-primitive"

const meta: Meta<typeof AvatarPrimitive> = {
  title: "Primitives/Avatar",
  component: AvatarPrimitive,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    size:  { control: "select", options: ["sm", "md", "lg"] },
    color: { control: "select", options: ["zinc"] },
    initials: { control: "text" },
  },
}

export default meta
type Story = StoryObj<typeof AvatarPrimitive>

export const Default: Story = {
  args: {
    initials: "EH",
    size: "sm",
  },
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-end gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <AvatarPrimitive size={size} initials="EH" />
          <span className="text-fs-75 text-muted-foreground font-type-body">{size}</span>
        </div>
      ))}
    </div>
  ),
}

export const NoInitials: Story = {
  name: "No initials (anonymous)",
  args: {
    size: "sm",
  },
}

export const TwoLetters: Story = {
  name: "Two-letter initials",
  args: {
    initials: "TH",
    size: "md",
  },
}

export const Group: Story = {
  name: "Avatar group",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-1">
          <div className="flex -space-x-1.5">
            <AvatarPrimitive size={size} initials="EH" className="ring-2 ring-background" />
            <AvatarPrimitive size={size} initials="SC" className="ring-2 ring-background" />
            <AvatarPrimitive size={size} initials="TH" className="ring-2 ring-background" />
          </div>
          <span className="ml-3 text-fs-75 text-muted-foreground font-type-body">{size}</span>
        </div>
      ))}
    </div>
  ),
}
