---
name: solid-md3
description: Material Design 3 component library for SolidJS
colors:
    forest: "#3e802b"
    on-forest: "#ffffff"
    forest-container: "#c0f0a9"
    on-forest-container: "#022200"
    birch: "#52634c"
    on-birch: "#ffffff"
    birch-container: "#d5e8ca"
    on-birch-container: "#101f0c"
    moss-teal: "#396663"
    on-moss-teal: "#ffffff"
    moss-teal-container: "#bcece7"
    on-moss-teal-container: "#00201e"
    error: "#ba1a1a"
    on-error: "#ffffff"
    error-container: "#ffdad6"
    on-error-container: "#410002"
    warning-container: "#fef08a"
    on-warning-container: "#92400e"
    warm-paper: "#f8faf2"
    surface-dim: "#d8dbd2"
    surface-bright: "#f8faf2"
    container-lowest: "#ffffff"
    container-low: "#f2f4ec"
    container: "#eceee6"
    container-high: "#e6e9e1"
    container-highest: "#e1e3db"
    deep-ink: "#1a1c18"
    ink-variant: "#43483e"
    outline: "#73786e"
    outline-variant: "#c3c8bc"
typography:
    display:
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontWeight: 400
        lineHeight: 1.2
    headline:
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontWeight: 600
        lineHeight: 1.3
    title:
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontWeight: 500
        lineHeight: 1.4
    body:
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontWeight: 400
        lineHeight: 1.5
    label:
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontWeight: 500
        lineHeight: 1.4
        letterSpacing: "0.01em"
rounded:
    xs: "4px"
    sm: "8px"
    md: "12px"
    lg: "16px"
    xl: "28px"
    full: "9999px"
spacing:
    xs: "4px"
    sm: "8px"
    md: "12px"
    lg: "16px"
    xl: "24px"
    xxl: "32px"
components:
    button-filled:
        backgroundColor: "{colors.forest}"
        textColor: "{colors.on-forest}"
        rounded: "{rounded.full}"
        padding: "6px 24px"
        height: "40px"
    button-filled-hover:
        backgroundColor: "{colors.forest}"
        textColor: "{colors.on-forest}"
        rounded: "{rounded.full}"
    button-tonal:
        backgroundColor: "{colors.birch-container}"
        textColor: "{colors.on-birch-container}"
        rounded: "{rounded.full}"
        padding: "6px 24px"
    button-outlined:
        textColor: "{colors.forest}"
        rounded: "{rounded.full}"
        padding: "6px 24px"
    button-text:
        textColor: "{colors.forest}"
        rounded: "{rounded.full}"
        padding: "6px 24px"
    button-elevated:
        backgroundColor: "{colors.container-low}"
        textColor: "{colors.forest}"
        rounded: "{rounded.full}"
        padding: "6px 24px"
    card-elevated:
        backgroundColor: "{colors.container-low}"
        rounded: "{rounded.lg}"
        padding: "24px"
    card-filled:
        backgroundColor: "{colors.container-highest}"
        rounded: "{rounded.lg}"
        padding: "24px"
    card-outlined:
        backgroundColor: "{colors.warm-paper}"
        rounded: "{rounded.lg}"
        padding: "24px"
    pill-filled:
        backgroundColor: "{colors.forest-container}"
        textColor: "{colors.on-forest-container}"
        rounded: "{rounded.full}"
        padding: "2px 10px"
    pill-tonal:
        backgroundColor: "{colors.birch-container}"
        textColor: "{colors.on-birch-container}"
        rounded: "{rounded.full}"
    pill-outlined:
        textColor: "{colors.deep-ink}"
        rounded: "{rounded.full}"
    pill-error:
        backgroundColor: "{colors.error-container}"
        textColor: "{colors.on-error-container}"
        rounded: "{rounded.full}"
    pill-warning:
        backgroundColor: "{colors.warning-container}"
        textColor: "{colors.on-warning-container}"
        rounded: "{rounded.full}"
    checkbox:
        rounded: "{rounded.xs}"
        backgroundColor: "{colors.warm-paper}"
    checkbox-checked:
        backgroundColor: "{colors.forest}"
        textColor: "{colors.on-forest}"
        rounded: "{rounded.xs}"
    text-input:
        backgroundColor: "{colors.container-lowest}"
        rounded: "{rounded.sm}"
        textColor: "{colors.deep-ink}"
    text-input-focus:
        backgroundColor: "{colors.container-lowest}"
        rounded: "{rounded.sm}"
        textColor: "{colors.deep-ink}"
    modal:
        backgroundColor: "{colors.container}"
        rounded: "{rounded.lg}"
    modal-backdrop:
        backgroundColor: "rgba(0,0,0,0.4)"
    nav-item:
        rounded: "{rounded.full}"
        textColor: "{colors.ink-variant}"
    nav-item-active:
        backgroundColor: "{colors.birch-container}"
        textColor: "{colors.on-birch-container}"
        rounded: "{rounded.full}"
---

# Design System: solid-md3

## 1. Overview

**Creative North Star: "The Tonic"**

Green on off-white. No decoration. Every pixel follows the Material Design 3 specification, and the visual system doesn't compete with the components it contains.

This is MD3 executed faithfully through SolidJS. Forest Green anchors a restrained palette; surface containers create depth through tonal contrast rather than heavy shadows. Buttons are pill-shaped, cards are gently rounded, inputs use the spec's state-layer model. The visual vocabulary is MD3 by the numbers — no invented affordances, no decorative motion, no gradient accents. The library's 30+ components _are_ the design system, each shipping every state the spec requires.

The system explicitly rejects over-styled component libraries with heavy animations, decorative gradients, or invented affordances. If a treatment isn't in the Google MD3 guidelines, it doesn't belong here.

**Key Characteristics:**

- Spec-accurate MD3 color roles with Forest Green primary and warm-tinted neutrals
- Single-family typography (Roboto) at MD3 scale ratios
- Tonal layering via surface containers, not heavy shadows
- Full-radius interactive elements (buttons, pills, nav items)
- State layers on every interactive surface (hover, focus-visible, active)
- Motion at MD3 spec durations and curves (200ms short, 400ms medium, cubic-bezier standard easing)

## 2. Colors

A green-primary MD3 palette with warm-tinted neutrals. Forest Green (#3e802b) carries the brand identity; the neutral surface family trends warm-paper (oklch(97.5% 0.008 120)) through warm-tinted container steps.

### Primary

- **Forest Green** (#3e802b, oklch(55% 0.19 135)): Filled buttons, active checkbox, selected tabs, primary interactive treatment.
- **Forest Container** (#c0f0a9, oklch(88% 0.13 135)): Filled pill backgrounds, primary container surfaces.

### Secondary

- **Birch** (#52634c, oklch(42% 0.05 140)): Secondary actions, navigation active states.
- **Birch Container** (#d5e8ca, oklch(88% 0.06 135)): Tonal button backgrounds, selected nav item backgrounds.

### Tertiary

- **Moss Teal** (#396663, oklch(42% 0.05 190)): Progress indicators, data-visualization accent.
- **Moss Teal Container** (#bcece7, oklch(90% 0.07 185)): Tertiary container surfaces.

### Neutral

- **Warm Paper** (#f8faf2, oklch(97.5% 0.008 120)): App background, card surfaces.
- **Container Lowest** (#ffffff): Input field backgrounds, surfaces needing highest contrast.
- **Container Low** (#f2f4ec): Elevated card backgrounds.
- **Container** (#eceee6): Modal dialog backgrounds.
- **Container High** (#e6e9e1): Side navigation surfaces.
- **Container Highest** (#e1e3db): Filled card backgrounds.
- **Deep Ink** (#1a1c18, oklch(12% 0.01 130)): Primary body text.
- **Ink Variant** (#43483e, oklch(30% 0.01 130)): Secondary text, placeholder text, subdued labels.

### Semantic

- **Error** (#ba1a1a — oklch(50% 0.2 30)): Error states, destructive actions, validation messages.
- **Error Container** (#ffdad6 — oklch(92% 0.06 30)): Error pill backgrounds.
- **Warning Container** (#fef08a — oklch(95% 0.13 95)): Warning pill backgrounds.

### Named Rules

**The Primary Restraint Rule.** Forest Green appears on ≤15% of any given surface — filled buttons, active checkbox, selected tabs, and the active indicator. Its scarcity makes it directional; it tells the user where to act, not where to rest.

**The Tinted Neutral Rule.** The surface-to-container-highest scale trends green (oklch hue 120) at chroma 0.005–0.012. Neutrals carry the brand's hue, not a default warm tone.

## 3. Typography

**Display Font:** Roboto (with system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif fallback)
**Body Font:** Roboto (same stack)

One family throughout. MD3 product UI doesn't need a display/body pairing — Roboto's multi-weight range carries headings, buttons, labels, body text, and data with consistent voice.

**Character:** Neutral, legible, spec-true. Roboto's geometric-humanist blend reads cleanly at every size without personality competing with the components it labels.

### Hierarchy

- **Display** (regular 400, 3.5625rem/2.8125rem/2.25rem, 1.2 line-height): Page titles only. Used in the demo showcase heading; not for data-dense app UIs.
- **Headline** (semibold 600, 2rem/1.75rem/1.5rem, 1.3 line-height): Section headings, modal titles. text-wrap: balance for even line length.
- **Title** (medium 500, 1.375rem/1rem/0.875rem, 1.4 line-height): Card titles, list item headings, navigation labels. The most common heading scale.
- **Body** (regular 400, 1rem/0.875rem/0.75rem, 1.5 line-height): Prose, descriptions, modal body content. Max line length 65–75ch.
- **Label** (medium 500, 0.875rem/0.75rem/0.6875rem, 1.4 line-height, 0.01em letter-spacing): Input labels, button text, chip labels, table headers.

### Named Rules

**The No-Clamp Rule.** Typography uses fixed rem values, not clamp(). Product UIs at consistent DPI don't benefit from fluid sizing, and a fluid h1 that shrinks in a sidebar panel looks worse, not better.

## 4. Elevation

Layered depth via surface container tonal contrast, with subtle shadows for floating elements. The surface-container system (lowest → low → default → high → highest) creates elevation through background lightness variation alone. Shadows are reserved for elements that appear above the surface plane — modals, elevated buttons, dropdown menus, elevated cards.

### Shadow Vocabulary

- **Elevation 1** (`0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)`): Elevated buttons, small floating elements.
- **Elevation 2** (`0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)`): Elevated cards, dropdown menus, tooltips.
- **Elevation 3** (`0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.3)`): Modals, sidebar menus, popovers.

### Named Rules

**The Layered-By-Default Rule.** Two surfaces at the same visual depth should never both carry shadows. Shadow is reserved for the floating element; the surface below provides depth through its container step.

## 5. Components

### Buttons

- **Shape:** Pill (full-radius, 9999px)
- **Sizes:** sm (32px tall, 12px horizontal padding), md (40px tall, 24px padding), lg (48px tall, 32px padding)
- **5 variants:**
    - **Filled:** Forest Green background, white text. Primary call-to-action. Shadow elevation 1 at rest, elevation 2 on hover.
    - **Tonal:** Birch container background, on-birch-container text. Secondary action, less visual weight than filled.
    - **Outlined:** Outline border (#73786e), Forest Green text. Moderate emphasis.
    - **Text:** Forest Green text only, no background. Lowest emphasis.
    - **Elevated:** Container-low background, Forest Green text. Shadow elevation 1 card-like button.
- **Icon-only mode:** Square proportions (32px/40px/48px), centered icon.
- **States:** hover (state-layer at 8% on-surface), focus-visible (2px outline, 2px offset, Forest Green), active (12% state-layer), disabled (38% opacity, no pointer events).
- **Transition:** all properties 200ms with MD3 standard easing.

### Cards

- **Corner Style:** 16px radius (`rounded-2xl`)
- **Padding:** 24px
- **3 variants:**
    - **Elevated:** Container-low background, elevation 1 shadow.
    - **Filled:** Container-highest background, no shadow.
    - **Outlined:** Warm Paper background, outline-variant border, no shadow.

### Inputs / Text Fields

- **Shape:** 8px radius (`rounded-md3-sm`)
- **Background:** Container-lowest
- **Default border:** Outline-variant (#c3c8bc)
- **Hover:** Outline (#73786e)
- **Focus:** Forest Green border with 1px ring
- **Error:** Error border (#ba1a1a) with error focus ring
- **Padding:** 12px horizontal, 6px vertical
- **Placeholder:** Ink Variant (#43483e) — 4.5:1 contrast against container-lowest (verified)
- **Label:** 14px medium weight, Deep Ink color

### Checkbox

- **Shape:** 4px radius (`rounded-md3-xs`)
- **Frame:** 20x20px, 2px outline border
- **Unchecked:** Outline (#73786e) border, no fill
- **Checked:** Forest Green fill, white check icon
- **Indeterminate:** Forest Green fill, white remove icon
- **Label:** 14px medium weight, Deep Ink
- **Description:** 12px, Ink Variant

### Pills / Chips

- **Shape:** Full-radius pill, 9999px
- **Padding:** 4px vertical, 10px horizontal
- **Font:** 12px semibold uppercase, 500 weight
- **6 variants:** filled, tonal, outlined, surface, error, warning — each maps to the corresponding container/on-container color pair.

### Modal / Dialog

- **Shape:** 16px radius (desktop, `rounded-xl`), 16px top-only radius (mobile bottom-sheet)
- **Backdrop:** Full-screen, 40% black overlay, fade animation
- **Panel:** Container background, outline-variant border, elevation 3 shadow
- **Max height:** 90vh
- **Width variants:** xs (max-w-xs), sm (max-w-md), md (max-w-2xl), lg (max-w-4xl)
- **Animation:** Fade + zoom 95→100% at 200ms standard easing, reverse on close
- **Header:** 24px horizontal padding, 16px vertical, bottom border
- **Body:** 24px horizontal padding, 16px vertical, scrollable
- **Footer:** 24px horizontal padding, 16px vertical, top border, right-aligned actions

### Navigation / Side Nav

- **Collapsed width:** 68px (icon-only)
- **Expanded width:** 240px
- **Transition:** Width animation at 300ms standard easing
- **Item shape:** Full-radius pill
- **Item padding:** 12px horizontal, 10px vertical
- **Default text:** Ink Variant (#43483e)
- **Hover:** Container-high background, Deep Ink text, state layer
- **Active:** Birch container background, on-birch-container text
- **Overflow:** Items exceeding available height collapse into a "More" dropdown with elevation 3 shadow
- **Sections:** Collapsible via nested dropdown with same item styling

## 6. Do's and Don'ts

### Do:

- **Do** use Forest Green for primary actions only — filled buttons, active checkbox, selected tabs. Its scarcity makes it directional.
- **Do** prefer tonal buttons for secondary actions; they carry the secondary container color with less weight than filled.
- **Do** use the surface-container system for depth — `container-lowest` → `container-highest` creates elevation without shadows.
- **Do** use the state-layer utility on every interactive element. Hover at 8%, focus-visible at 12%, active at 12% opacity of on-surface.
- **Do** use MD3 spec easing curves: standard `cubic-bezier(0.2, 0, 0, 1)` for most transitions, emphasized `cubic-bezier(0.05, 0.7, 0.1, 1)` for expressive motion.
- **Do** use text-wrap: balance on headline-level text (h1–h3) for even line length.

### Don't:

- **Don't** add gradient text, glassmorphism, or decorative motion — none of these exist in the spec.
- **Don't** use side-stripe borders (`border-left`/`border-right` > 1px) as colored accents on cards or callouts. Use full borders, background tints, or nothing.
- **Don't** invent decorative visual flourishes where MD3 already defines the treatment. Every component has a spec-documented state vocabulary.
- **Don't** use display fonts for UI labels, buttons, or data. Roboto at the label weight carries the entire interface.
- **Don't** use modal as default for decision prompts. Exhaust inline and progressive alternatives first.
- **Don't** put arbitrary z-index values. Use the built-in z-index scale: dropdown → sticky → modal-backdrop → modal → toast → tooltip.
- **Don't** use bounce or elastic easing curves. MD3's cubic-bezier curves are the only allowed motion vocabulary.
- **Don't** leave placeholder or disabled text at low contrast. Placeholder text must hit 4.5:1 against its background.
- **Don't** apply the eyebrow pattern (small uppercase tracked text like "FEATURES" or "ABOUT") above every section. One deliberate branded kicker is voice; every-section eyebrows are AI grammar.
