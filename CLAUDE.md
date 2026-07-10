@AGENTS.md

# Design system

**Read `docs/design-system.md` before writing or modifying any component.**

Every component must conform to these rules — no exceptions:

- **Typography tokens only.** Never `text-sm`, `text-base`, `text-lg`, `font-sans`, `font-serif`. Use `text-fs-*` and `font-type-body` / `font-type-heading`.
- **Semantic colour tokens only.** Never `text-gray-500`, `bg-slate-100`, or any hex value. Use `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-muted`, `border-border`, etc.
- **Tier discipline.** Primitives live in `components/ui/` and have no product logic. Composites and patterns live in `components/<domain>/`. Screens live in `app/`.
- **Every primitive needs a Storybook story** at `components/ui/<name>.stories.tsx` with `title: "Primitives/<Name>"` and at minimum a `Default` and `AllStates` story.
- **`Button asChild` is not supported.** For a link styled as a button, use `cn(buttonVariants({ variant, size }))` directly on a `<Link>`.
- **`Text` does not accept heading elements.** Use the `Heading` component for `h1`–`h6`. `Text` only accepts `p | span | div | label | li | dt | dd | figcaption`.

When creating a new UI component, confirm it belongs in the design system, place it in the correct tier folder, and add a story before considering it done.
