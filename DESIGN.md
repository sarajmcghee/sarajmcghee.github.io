---
name: Red Maple
description: Sara McGhee's portfolio — a forest-minimal identity for an AI engineer who works on legacy systems.
color:
  light:
    background: "#F1F3EE"
    surface: "#FBFCFA"
    surface-sunk: "#E8ECE4"
    text: "#12211C"
    text-muted: "#55625A"
    text-faint: "#7C8880"
    accent: "#A8322B"
    accent-soft: "rgba(168, 50, 43, 0.10)"
    secondary: "#0B6A73"
    bark: "#7C6A54"
    rule: "rgba(18, 33, 28, 0.14)"
    rule-soft: "rgba(18, 33, 28, 0.07)"
  dark:
    background: "#0E1512"
    surface: "#151D18"
    surface-sunk: "#101815"
    text: "#E4EAE2"
    text-muted: "#9AA79E"
    text-faint: "#75837A"
    accent: "#E2685A"
    accent-soft: "rgba(226, 104, 90, 0.13)"
    secondary: "#59B3B4"
    bark: "#B39B7C"
    rule: "rgba(228, 234, 226, 0.16)"
    rule-soft: "rgba(228, 234, 226, 0.08)"
typography:
  display:
    family: "Fraunces"
    fallback: "Georgia, 'Times New Roman', serif"
    weights: [400, 600, 700]
  body:
    family: "IBM Plex Sans"
    fallback: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    weights: [400, 500, 600]
  mono:
    family: "IBM Plex Mono"
    fallback: "ui-monospace, 'SF Mono', Menlo, monospace"
    weights: [400, 500]
  scale:
    hero: "clamp(2.6rem, 6vw, 4.5rem)"
    h2: "clamp(1.6rem, 3vw, 2.4rem)"
    h3: "1.15rem"
    body: "1.0625rem"
    small: "0.9375rem"
    label: "0.71rem"
  measure: "68ch"
  line-height:
    tight: 1.06
    heading: 1.18
    body: 1.62
spacing:
  unit: 4
  scale: [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
radius:
  sm: "3px"
  md: "6px"
  lg: "10px"
  pill: "999px"
motion:
  fast: "120ms"
  base: "220ms"
  slow: "420ms"
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)"
---

# Red Maple — design system

The machine-readable tokens are the front matter above. This body explains the reasoning, so
that a change to the palette is a decision rather than a preference.

## The idea

A red maple in the southeastern woods: quiet green-grey most of the year, one decisive burst of
scarlet. That is the whole design. Everything on the page is restrained except one accent, used
in a small number of deliberate places.

The site argues that its author has judgment. A loud site would undercut the argument.

## Color

**Neutrals carry a green bias.** `#F1F3EE` is a lichen paper, not a cream, and the greys are
pulled toward the accent's opposite rather than sitting at pure neutral. Warm cream with a
serif and a terracotta accent is the current house style of AI-generated design; this palette
deliberately steps around it.

**One accent: `#A8322B`, red maple.** It appears on the primary call to action, on the active
navigation state, and on link hover. Nowhere else. If a third use appears, one of the three is
wrong.

**`#0B6A73` kingfisher teal is a callback, not a second brand color.** Carried over from the
previous portfolio, it appears in exactly one section — Field notes, where the bird
illustrations live. Its rarity is what makes it read as intentional.

**Dark is designed, not inverted.** The accent lightens to `#E2685A` because `#A8322B` on a
`#0E1512` ground fails contrast and reads as dried blood rather than autumn.

## Typography

**Fraunces** for display. Carried over from the previous site, and the right call — its optical
size axis gives large headings a drawn quality that suits the subject without a single leaf
illustration.

**IBM Plex Sans** for body, **IBM Plex Mono** for labels, metrics, and code. Plex reads as
engineering rather than startup. It is also a deliberate move away from Inter and Space
Grotesk, which have become the default faces of generated portfolios — the wrong association
for a site whose argument is the author's own judgment.

Running text stays near 68 characters. Uppercase mono labels get `0.12em` tracking.

## Layout

One column, generous vertical rhythm, hairline rules in preference to card borders. A card must
earn its elevation; most content does not need one. Spacing comes from flex and grid `gap`, not
per-element margins.

## Motion

Motion is used where it explains something and nowhere else. Scroll-linked reveals are allowed;
ambient decoration is not. The 3D hero is the single exception and it is governed by a hard
performance budget.

`prefers-reduced-motion: reduce` disables the canvas entirely and swaps in a static render. Not
slowed — off.

## Accessibility

- AA contrast for body text and controls in both themes.
- Visible focus ring: 2px accent, 3px offset.
- The hero canvas is `aria-hidden` with a text alternative.
- Every interactive target reachable by keyboard.

## Performance budget

These are ship gates, not aspirations.

| Gate | Target |
|---|---|
| Hero text painted | < 1.2 s |
| LCP | < 2.0 s |
| App JS (gzipped, excl. three) | < 180 KB |
| Tree model | < 900 KB |
| Social preview image | < 200 KB |
| Any single illustration | < 120 KB |

## Rules for agents working in this repo

1. Read this file before changing any styling.
2. Never introduce a raw hex value in a component. Use a token.
3. Never define a color only inside a media query or `[data-theme]` block — define it on
   `:root` first, then override.
4. If a design decision here is wrong, change this file and then the code. Not the reverse.
