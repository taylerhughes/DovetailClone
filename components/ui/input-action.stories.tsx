import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { InputAction } from "./input-action";

const meta: Meta<typeof InputAction> = {
  title: "Primitives/InputAction",
  component: InputAction,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["text", "email", "search", "url"] },
    placeholder: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    pending: { control: "boolean" },
  },
  args: {
    type: "email",
    placeholder: "Enter your work email…",
  },
};

export default meta;
type Story = StoryObj<typeof InputAction>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { value: "tayler@willard.design" },
};

export const WithError: Story = {
  name: "Error state",
  args: {
    value: "not-an-email",
    error: "Please enter a valid email address.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: "tayler@willard.design" },
};

export const Pending: Story = {
  args: { value: "tayler@willard.design", pending: true },
};

export const AsSearch: Story = {
  name: "As search input",
  args: { type: "search", placeholder: "Search notes…", value: "" },
};

export const Interactive: Story = {
  name: "Interactive (submit flow)",
  parameters: { controls: { disable: true } },
  render: () => {
    const [value, setValue] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    function handleSubmit() {
      if (!value.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
      setError("");
      setPending(true);
      setTimeout(() => {
        setPending(false);
        setSubmitted(true);
      }, 1200);
    }

    return (
      <div className="flex w-80 flex-col gap-4">
        {submitted ? (
          <p className="font-type-body text-fs-100 text-foreground">
            ✓ Check your inbox at <strong>{value}</strong>
          </p>
        ) : (
          <InputAction
            type="email"
            placeholder="Enter your work email…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onSubmit={handleSubmit}
            pending={pending}
            error={error}
          />
        )}
      </div>
    );
  },
};

export const AllStates: Story = {
  name: "All states",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="font-type-body text-fs-75 text-muted-foreground">Empty</p>
        <InputAction type="email" placeholder="Enter your work email…" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-type-body text-fs-75 text-muted-foreground">With value</p>
        <InputAction type="email" placeholder="Enter your work email…" value="tayler@willard.design" onChange={() => {}} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-type-body text-fs-75 text-muted-foreground">Error</p>
        <InputAction
          type="email"
          placeholder="Enter your work email…"
          value="not-valid"
          onChange={() => {}}
          error="Please enter a valid email address."
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-type-body text-fs-75 text-muted-foreground">Disabled</p>
        <InputAction type="email" placeholder="Enter your work email…" disabled value="tayler@willard.design" onChange={() => {}} />
      </div>
    </div>
  ),
};
