---
name: Sentinel
colors:
  surface: '#161616'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#dbc2ae'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a38d7b'
  outline-variant: '#554335'
  surface-tint: '#ffb874'
  primary: '#ffb874'
  on-primary: '#4b2800'
  primary-container: '#f7931a'
  on-primary-container: '#603500'
  inverse-primary: '#8c4f00'
  secondary: '#c9c6c1'
  on-secondary: '#31302d'
  secondary-container: '#474743'
  on-secondary-container: '#b7b5b0'
  tertiary: '#86cfff'
  on-tertiary: '#00344c'
  tertiary-container: '#00b6fe'
  on-tertiary-container: '#004462'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbf'
  primary-fixed-dim: '#ffb874'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6b3b00'
  secondary-fixed: '#e5e2dd'
  secondary-fixed-dim: '#c9c6c1'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#86cfff'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6d'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  muted-text: '#8A8580'
  border: rgba(255, 255, 255, 0.08)
  success: '#22C55E'
  danger: '#EF4444'
typography:
  display-serif:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-serif:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-serif-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 1.5rem
  margin-desktop: 4rem
  gutter: 1rem
  section-gap: 5rem
  stack-compact: 0.5rem
  stack-default: 1.5rem
---

## Brand & Style

The design system is built upon the concept of a "digital testament"—a quiet, solemn, and deeply personal space for Bitcoin inheritance. Moving away from the high-energy, speculative aesthetics of fintech and crypto, this design system adopts a **Minimalist-Premium** style. It evokes the feeling of a private vault or a handwritten letter: intimate, serious, and enduring.

The visual narrative centers on reliability and "proof of life." The atmosphere is dark and hushed, utilizing heavy whitespace and thin, precise lines to create a sense of order and calm. Transitions are slow and deliberate, reflecting the gravity of the subject matter.

**Design Principles:**
- **Quietude:** No aggressive gradients, glows, or unnecessary animations.
- **Precision:** Thin 0.5px borders and monospaced technical accents.
- **Intimacy:** Serif italics for emotional touchpoints to contrast against functional UI.

## Colors

The palette is strictly dark and grounded. The primary background (#0D0D0D) provides a void-like canvas, while card surfaces (#161616) emerge with very subtle contrast. 

- **Primary (Bitcoin Orange):** Used exclusively for the "heartbeat" line and critical "proof of life" actions. It is a beacon of activity within the dark UI.
- **Warm White:** Used for high-readability text, providing a softer, more organic feel than pure white.
- **Muted Gray:** Used for secondary information and labels to maintain the "hushed" hierarchy.
- **Functional Colors:** Success and Danger hues are desaturated to ensure they do not break the premium, somber aesthetic.

## Typography

Typography serves two distinct roles: **Functional** and **Emotional**.

1.  **Emotional (Playfair Display):** Used for headlines and quotes. Always rendered in Italic to suggest a personal, human touch. This is the "voice" of the testament.
2.  **Functional (Inter):** Used for all UI controls, body text, and navigation. It provides a clean, neutral foundation that stays out of the way.
3.  **Technical (JetBrains Mono):** Used sparingly for Bitcoin addresses, timestamps, and "proof of life" countdowns to imply technical accuracy and security.

Avoid bold weights in the serif typeface to maintain elegance. Use generous line heights for body text to ensure a comfortable, slow reading pace.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop (centered, max-width 1100px) to create an intimate "document" feel. 

**Structure:**
- **Desktop:** 12-column grid with 64px margins.
- **Mobile:** Single column with 24px margins.
- **Whitespace:** Emphasize vertical rhythm. Use large gaps (80px+) between major sections to allow the content to "breathe" and give the user time to process the information.
- **Alignment:** Content is generally left-aligned to mimic the structure of a formal letter or legal document.

## Elevation & Depth

This system avoids traditional shadows. Depth is communicated through **Tonal Layers** and **Outline Definition**.

- **Z-0 (Background):** #0D0D0D - The base layer.
- **Z-1 (Surfaces):** #161616 - Used for cards and input containers.
- **Borders:** A consistent 0.5px border (rgba(255,255,255,0.08)) is used to define the edges of surfaces. 
- **Active State:** No lift or shadow on hover. Instead, use a subtle opacity shift or a thin border color change to the primary orange.

The "Heartbeat" line is the only element that may exist on its own visual plane, appearing as a thin, constant thread across the background or within specific monitoring cards.

## Shapes

The shape language is "Soft-Square." 

- **UI Controls:** Buttons and inputs use an 8px radius (rounded-md), balancing modern clean lines with a slight approachability.
- **Containers:** Content cards and modals use a 12px radius (rounded-lg) to frame personal content with a gentler edge.
- **Icons:** Use Tabler Outline icons. Maintain a consistent 1.5px stroke width to match the thin-border aesthetic of the UI.

## Components

**Buttons:**
- **Primary:** Solid #F0EDE8 text on #161616 background with a 0.5px white border. High contrast, low "flashiness."
- **Ghost:** Transparent background with the 0.5px border. For secondary actions.
- **Alert:** Text-only with a subtle underline in the primary orange for the "Proof of Life" check-in.

**Cards:**
- Solid #161616 background.
- 0.5px border.
- No shadows.
- Inner padding should be generous (min 32px).

**Inputs:**
- Background #0D0D0D.
- Bottom-border only (1px) to mimic a signature line on a document, or a fully enclosed box with 0.5px border for security codes.

**The Heartbeat:**
- A custom SVG component. A thin (1px) orange line with a slow, rhythmic "pulse" animation. Used as a status indicator for the user's "Sentinel" status.

**Lists:**
- Separated by thin 0.5px horizontal rules. No alternating row colors.
- Use JetBrains Mono for any numerical or date-based data within the list.