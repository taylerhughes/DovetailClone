import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Heading, LEVEL_DEFAULT_SIZE, type HeadingSize } from "./heading"
import { Text } from "./text"

const meta: Meta<typeof Heading> = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    level:  { control: "select", options: [1, 2, 3, 4, 5, 6] },
    size:   { control: "select", options: [50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300] },
    weight: { control: "select", options: ["regular", "medium", "bold"] },
    color:  { control: "select", options: ["default", "subdued", "disabled", "inverse"] },
  },
}

export default meta
type Story = StoryObj<typeof Heading>

const SAMPLE = "The quick brown fox jumps over the lazy dog."

const ALL_SIZES: HeadingSize[] = [50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300]

export const Default: Story = {
  args: {
    level: 1,
    children: "The quick brown fox",
  },
}

export const AllLevels: Story = {
  name: "All levels (default sizes)",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <div key={level} className="flex items-baseline gap-4">
          <span className="w-20 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            h{level} · {LEVEL_DEFAULT_SIZE[level]}
          </span>
          <Heading level={level}>{SAMPLE}</Heading>
        </div>
      ))}
    </div>
  ),
}

export const SizeOverride: Story = {
  name: "Size override (level 2, all sizes)",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Text size={75} color="subdued" className="mb-2">
        All rows are rendered as <code className="font-mono">&lt;h2&gt;</code> in the DOM — only the visual size changes.
      </Text>
      {ALL_SIZES.map((size) => (
        <div key={size} className="flex items-baseline gap-4">
          <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {size}
          </span>
          <Heading level={2} size={size}>{SAMPLE}</Heading>
        </div>
      ))}
    </div>
  ),
}

export const MixedHierarchy: Story = {
  name: "Mixed hierarchy (realistic section)",
  parameters: { controls: { disable: true } },
  render: () => (
    <article className="flex flex-col gap-4 max-w-2xl">
      <Heading level={1}>Research synthesis</Heading>
      <Text size={200} color="subdued">
        An overview of findings from the Q2 discovery interviews with enterprise customers.
      </Text>
      <Heading level={2} className="mt-4">Key themes</Heading>
      <Text size={100}>
        Across 14 interviews, three themes emerged consistently: onboarding friction, search discoverability, and collaboration gaps in async workflows.
      </Text>
      <Heading level={3} className="mt-2">Onboarding friction</Heading>
      <Text size={100}>
        Participants reported spending between 30 and 90 minutes before completing their first meaningful action. The most common blocker was unclear permission states — specifically, users weren't sure what they could share or who could see their content.
      </Text>
      <Heading level={3} className="mt-2">Search discoverability</Heading>
      <Text size={100}>
        Eight of fourteen participants described the search experience as "buried." Several had created workarounds — bookmarks, pinned tabs, external notes — to compensate for not being able to quickly surface past sessions.
      </Text>
      <Text size={75} color="subdued" className="mt-4">
        Last updated July 2026 · 14 interviews · Synthesis by Tayler Hughes
      </Text>
    </article>
  ),
}

export const Weights: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {(["regular", "medium", "bold"] as const).map((w) => (
        <div key={w} className="flex items-baseline gap-4">
          <span className="w-16 shrink-0 text-fs-75 text-muted-foreground">{w}</span>
          <Heading level={2} weight={w}>{SAMPLE}</Heading>
        </div>
      ))}
    </div>
  ),
}
