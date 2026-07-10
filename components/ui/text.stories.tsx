import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Text } from "./text"

const meta: Meta<typeof Text> = {
  title: "Primitives/Text",
  component: Text,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    as:     { control: "select", options: ["p", "span", "div", "label", "li", "dt", "dd", "figcaption"] },
    size:   { control: "select", options: [50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300] },
    weight: { control: "select", options: ["regular", "medium", "bold"] },
    color:  { control: "select", options: ["default", "subdued", "disabled", "inverse"] },
    family: { control: "select", options: ["satoshi", "sans"] },
  },
}

export default meta
type Story = StoryObj<typeof Text>

const SAMPLE = "The quick brown fox jumps over the lazy dog."
const LOREM = "Research interviews are conversations with a purpose. Unlike a chat, they follow a loose structure designed to surface the insights participants might not volunteer on their own. The interviewer listens more than they speak, follows threads, and knows when to press and when to leave silence."

const SCALE: Array<{ step: number; desktop: string; mobile: string }> = [
  { step: 50,   desktop: "11px", mobile: "13px" },
  { step: 75,   desktop: "12px", mobile: "15px" },
  { step: 100,  desktop: "14px", mobile: "17px" },
  { step: 200,  desktop: "16px", mobile: "19px" },
  { step: 300,  desktop: "18px", mobile: "22px" },
  { step: 400,  desktop: "20px", mobile: "24px" },
  { step: 500,  desktop: "22px", mobile: "27px" },
  { step: 600,  desktop: "25px", mobile: "31px" },
  { step: 700,  desktop: "28px", mobile: "34px" },
  { step: 800,  desktop: "32px", mobile: "39px" },
  { step: 900,  desktop: "36px", mobile: "44px" },
  { step: 1000, desktop: "40px", mobile: "49px" },
  { step: 1100, desktop: "45px", mobile: "55px" },
  { step: 1200, desktop: "50px", mobile: "62px" },
  { step: 1300, desktop: "60px", mobile: "70px" },
]

export const Default: Story = {
  args: {
    size: 100,
    children: SAMPLE,
  },
}

export const ScaleDesktop: Story = {
  name: "Size scale (desktop)",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {SCALE.map(({ step, desktop, mobile }) => (
        <div key={step} className="flex items-baseline gap-4">
          <span className="w-28 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {step} · {desktop} / {mobile}
          </span>
          <Text size={step as Parameters<typeof Text>[0]["size"]}>{SAMPLE}</Text>
        </div>
      ))}
    </div>
  ),
}

export const Weights: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["regular", "medium", "bold"] as const).map((w) => (
        <div key={w} className="flex items-baseline gap-4">
          <span className="w-16 shrink-0 text-fs-75 text-muted-foreground">{w}</span>
          <Text size={200} weight={w}>{SAMPLE}</Text>
        </div>
      ))}
    </div>
  ),
}

export const Colors: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size={200} color="default">Default — {SAMPLE}</Text>
      <Text size={200} color="subdued">Subdued — {SAMPLE}</Text>
      <Text size={200} color="disabled">Disabled — {SAMPLE}</Text>
      <div className="bg-primary rounded-lg p-4">
        <Text size={200} color="inverse">Inverse — {SAMPLE}</Text>
      </div>
    </div>
  ),
}

export const LongBodyCopy: Story = {
  name: "Long body copy",
  args: {
    size: 100,
    children: LOREM,
    className: "max-w-prose",
  },
}

export const AsSpan: Story = {
  name: "As inline span",
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="text-fs-100 font-type-body text-foreground">
      This sentence contains{" "}
      <Text as="span" size={75} color="subdued">
        a smaller inline annotation
      </Text>{" "}
      embedded within it.
    </p>
  ),
}
