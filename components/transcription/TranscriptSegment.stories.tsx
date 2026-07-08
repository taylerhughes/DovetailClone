import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TranscriptSegment } from "./TranscriptSegment";

const meta: Meta<typeof TranscriptSegment> = {
  title: "Composites/TranscriptSegment",
  component: TranscriptSegment,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    speakerName: { control: "text" },
    speakerInitials: { control: "text" },
    text: { control: "text" },
    // Disable controls for complex array type — use named stories instead
    highlights: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof TranscriptSegment>;

const SAMPLE_TEXT =
  "We love Satoshi stylistically because it combines both Grotesk-style styles, but with a more geometrically-designed twist. Satoshi is available in 10 static and two variable styles and supports 135 languages. It's 100% free for personal projects and commercial use.";

export const Default: Story = {
  args: {
    speakerName: "Edward Hughes",
    speakerInitials: "EH",
    text: SAMPLE_TEXT,
  },
};

export const WithHighlights: Story = {
  name: "With highlights (design spec)",
  args: {
    speakerName: "Edward Hughes",
    speakerInitials: "EH",
    text: SAMPLE_TEXT,
    highlights: [
      { start: 8, end: 30, color: "blue" },
      { start: 120, end: 154, color: "blue" },
      { start: 228, end: 245, color: "zinc" },
    ],
  },
};

export const NoInitials: Story = {
  args: {
    speakerName: "Speaker A",
    text: SAMPLE_TEXT,
  },
};

export const ShortUtterance: Story = {
  args: {
    speakerName: "Edward Hughes",
    speakerInitials: "EH",
    text: "That's a great point.",
  },
};

export const MultiSpeakerHighlights: Story = {
  args: {
    speakerName: "Sarah Chen",
    speakerInitials: "SC",
    text: SAMPLE_TEXT,
    highlights: [
      { start: 0, end: 40, color: "blue" },
      { start: 120, end: 160, color: "blue" },
      { start: 215, end: 250, color: "zinc" },
    ],
  },
};
