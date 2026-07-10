# Design System

This document is the authoritative reference for building UI in this codebase. Read it before touching any component.

---

## Principles

1. **Tokens are the only source of raw values.** No hex codes, no magic pixel numbers, anywhere in component code. All values flow from CSS custom properties defined in the token layer.
2. **Everything is tiered by composition.** Each tier has one job. The tier a component belongs to determines where it lives and what it can depend on.
3. **Storybook is the component catalogue.** Every primitive and composite must have a story. Stories are the contract between design and code.
4. **Typography is always expressed through tokens.** Never use Tailwind's built-in `text-sm`, `text-base`, `font-sans`, etc. Use our token classes.

---

## Component tiers

| Tier | What it is | Folder | Examples |
|---|---|---|---|
| **Foundations** | Design tokens — color, type, space, radius, motion. Not renderable on their own. | CSS variables (global styles) | `text-fs-100`, `font-type-body`, `text-foreground` |
| **Primitives** | Smallest rendered units. Built directly from tokens. No product logic, no data fetching. | `components/ui/` | `Button`, `Text`, `Heading`, `Input`, `InputAction`, `Avatar` |
| **Composites** | Two or more primitives combined into a reusable, still-generic unit. | `components/ui/` or `components/<domain>/` | `FormField`, `UserDisplay`, `NoteFieldsPanel` |
| **Patterns** | Composites and primitives solving a recurring product problem. Opinionated but reusable. | `components/<domain>/` | `NoteShareButton`, `TagManager`, `IntegrationCard` |
| **Screens** | Full page layouts populated with real content. Product-owned. | `app/` | Note page, Sign-in page |

**Boundary test for Primitive vs Composite:** does it hold more than one primitive, and does removing one change what it fundamentally is? `InputAction` alone is a primitive. `FormField` (label + input + help text) is a composite.

---

## Token reference

### Typography

Never use Tailwind's built-in type utilities (`text-sm`, `text-base`, `font-sans`, `font-serif`). Always use our token classes:

**Font family**
```
font-type-body      → Satoshi (body text, UI labels, inputs)
font-type-heading   → heading typeface
```

**Font size** — numeric scale, maps to CSS `--text-fs-*` variables:
```
text-fs-50    ≈ 11px / 13px
text-fs-75    ≈ 12px / 15px
text-fs-100   ≈ 14px / 17px   ← default body
text-fs-200   ≈ 16px / 19px
text-fs-300   ≈ 18px / 22px
text-fs-400   ≈ 20px / 24px
... (continues to text-fs-1300)
```

**Line height**
```
leading-type-snug    → tight headings and small labels
leading-type-normal  → body text (100–300)
leading-type-tight   → large display sizes (700+)
```

**Usage in JSX:** prefer the `Text` and `Heading` primitives over raw Tailwind classes wherever possible. Use raw classes only when the element type makes a component wrapper awkward (e.g., inside a table cell).

```tsx
// Correct
<Text size={100} color="subdued">Some label</Text>
<Heading level={2}>Section title</Heading>

// Also correct for inline utility use
<p className="font-type-body text-fs-100 text-foreground">...</p>

// Never
<p className="text-sm font-sans text-gray-500">...</p>
```

### Color

Use semantic tokens only — never raw palette values:

```
text-foreground         → primary text
text-muted-foreground   → subdued / secondary text
bg-background           → page/surface background
bg-muted                → subtle surface (hover states, sidebars)
border-border           → default border
border-ring             → focus ring border
text-destructive        → error text
border-destructive      → error border
```

### Spacing

Use Tailwind's spacing scale (`p-4`, `gap-2`, `mt-6`) — these map to our 4px base grid. Avoid arbitrary values (`p-[13px]`) unless you have a documented reason.

### Radius

Use `rounded-md`, `rounded-lg`, `rounded-xl` from Tailwind. These map to `--radius-*` CSS variables.

---

## Primitive inventory

All primitives live in `components/ui/`. Every one has a corresponding `.stories.tsx` file.

| Component | File | Storybook title | Notes |
|---|---|---|---|
| `Text` | `text.tsx` | `Primitives/Text` | Body text. Use `size`, `weight`, `color`, `family` props. |
| `Heading` | `heading.tsx` | `Primitives/Heading` | Semantic heading. `level` sets the HTML element; `size` controls visual scale independently. |
| `Button` | `button.tsx` | — | CVA variants: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`. Sizes: `default`, `sm`, `lg`, `xs`, `icon`, `icon-sm`, `icon-xs`, `icon-lg`. Wraps Base UI `ButtonPrimitive`. |
| `InputAction` | `input-action.tsx` | `Primitives/InputAction` | Text input with inline arrow-submit button. Pass `type="email"` etc. at the call site. Props: `error`, `onSubmit`, `pending`. |
| `Input` | `input.tsx` | — | Standard text input. |
| `Avatar` | `avatar-primitive.tsx` | `Primitives/Avatar` | Initials-based avatar. Sizes: `sm`, `md`, `lg`. |
| `Badge` | `badge.tsx` | — | Status/tag label. |
| `Button` (link) | — | — | Use `cn(buttonVariants({ variant, size }))` on a `<Link>` — do **not** use `Button asChild` (not supported). |

---

## Storybook conventions

Stories live alongside their component: `components/ui/foo.stories.tsx`.

```ts
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta: Meta<typeof MyComponent> = {
  title: "Primitives/MyComponent",   // or "Composites/...", "Patterns/..."
  component: MyComponent,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: { /* map every prop to a control */ },
  args: { /* sensible defaults visible in the canvas */ },
}

export default meta
type Story = StoryObj<typeof MyComponent>

// Required stories for every primitive:
export const Default: Story = { args: { ... } }
export const AllStates: Story = { /* render: () => ... */ }
```

**Required stories for every primitive:**
- `Default` — one story with the most common usage
- `AllStates` — single render showing every meaningful visual state (default, hover-implied, error, disabled, pending)

**Additional stories as needed:**
- One story per meaningfully different variant or size
- An `Interactive` story if the component has stateful behaviour worth demonstrating

**Never use Tailwind's raw type utilities in story render functions.** Stories are documentation — they must model correct token usage for anyone reading them as examples.

---

## Adding a new component

1. **Determine the tier.** Is it a primitive (one thing, no product logic)? A composite? A pattern?
2. **Build from tokens only.** No hex codes, no `text-sm`, no `font-sans`.
3. **Create the story** in the same folder, with the correct `title` for its tier.
4. **Add it to the primitive inventory** in this document if it's a primitive.
5. **TypeScript:** export the props interface. Use `React.ComponentProps<"input">` (or similar) as the base where appropriate, so all native attributes pass through.

---

## Things that are explicitly not allowed

- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` etc. — use `text-fs-*`
- `font-sans`, `font-serif`, `font-mono` (for UI text) — use `font-type-body` / `font-type-heading`
- Hardcoded colours (`text-gray-500`, `bg-slate-100`, `#3b82f6`) — use semantic tokens
- `Button asChild` — not supported; use `cn(buttonVariants(...))` on a `<Link>` directly
- `Text as="h1"` / `as="h2"` etc. — `Text` only accepts `p | span | div | label | li | dt | dd | figcaption`. Use `Heading` for headings.
- Magic pixel values in arbitrary Tailwind (`p-[13px]`, `w-[237px]`) without a documented reason
