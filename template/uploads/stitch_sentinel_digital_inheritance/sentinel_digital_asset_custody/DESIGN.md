---
name: Sentinel Digital Asset Custody
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#554335'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#887362'
  outline-variant: '#dbc2ae'
  surface-tint: '#8c4f00'
  primary: '#8c4f00'
  on-primary: '#ffffff'
  primary-container: '#f7931a'
  on-primary-container: '#603500'
  inverse-primary: '#ffb874'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#545f73'
  on-tertiary: '#ffffff'
  tertiary-container: '#a0abc2'
  on-tertiary-container: '#353f52'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcbf'
  primary-fixed-dim: '#ffb874'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#6b3b00'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  mono-technical:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 80px
---

## Brand & Style
The design system embodies a "Fortress in the Cloud" philosophy—blending the uncompromising security of cold storage with the fluid elegance of high-end fintech. It targets high-net-worth individuals and tech-literate users who require a platform that feels both impenetrable and effortless. 

The aesthetic is **Refined Minimalism** with a **Corporate Modern** foundation. It prioritizes clarity and serenity to reduce the anxiety typically associated with digital inheritance and estate planning. High-end cybersecurity cues are integrated through precision-engineered layouts, subtle technical micro-details, and an expansive use of negative space. The UI should evoke a sense of permanence, reliability, and absolute discretion.

## Colors
The palette is anchored by **Bitcoin Orange**, used sparingly as a "proof of life" accent and for critical calls to action, ensuring it remains high-impact without overwhelming the user. 

The core of the interface relies on the **Deep Navy** and **Night Blue** neutrals to establish an institutional, trustworthy atmosphere. Surface colors utilize a tiered system of soft grays and pure whites to create a clear sense of information hierarchy. Functional colors (Success/Alert) are used with high saturation but small footprints, maintaining the platform's overall calm and professional temperament.

## Typography
The system uses a dual-font strategy. **Geist** provides a technical, precise feel for headings and data labels, while **Inter** ensures maximum readability for body content and instructional text.

Headlines feature tighter letter-spacing and substantial weight to convey authority. For technical data—such as public keys, transaction IDs, or encryption standards—a monospaced variant of Geist is used to emphasize precision and allow for easy character differentiation. Line heights are generous to prevent visual fatigue during complex setup processes.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop (12 columns) to maintain a sense of controlled, institutional structure. On mobile, it transitions to a single-column fluid layout with rigorous 16px safe margins.

Spacing is aggressive and intentional. We use large "Section Padding" to separate distinct phases of the inheritance workflow, ensuring the user is never overwhelmed by too many inputs on a single screen. Elements are grouped using a logical hierarchy of 8px increments, where larger gaps denote a change in conceptual context.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Glassmorphism**, avoiding heavy shadows in favor of structural clarity. 

1.  **Base Layer:** White (#FFFFFF) or ultra-light gray (#F8FAFC).
2.  **Card Layer:** White surface with a 1px border (#E2E8F0) and an ultra-soft, large-radius ambient shadow (4% opacity, Deep Navy tint).
3.  **Floating Elements (Modals/Navigation):** Glassmorphic surfaces with a `backdrop-filter: blur(12px)` and a semi-transparent white fill (80% opacity). 

This layering strategy creates a sense of "Airy Security"—the interface feels light but physically structured.

## Shapes
The design system utilizes a **Rounded** language to soften the technical edge of the platform. While the base `rounded-md` (0.5rem) is used for inputs and buttons, primary containers and cards use `rounded-2xl` (1.5rem) to create a distinct, modern-premium look inspired by contemporary hardware design. Interactive elements like chips or "status heartbeats" use pill-shaped rounding to differentiate them from structural components.

## Components

### Navigation & Sidebar
The top navigation uses **Premium Glassmorphism** to stay present without obstructing content. The sidebar is high-contrast: Night Blue background with subtle 1px divider lines, using Lucide icons in a muted gray that transitions to Bitcoin Orange on active states.

### Security Badges
Badges should feel like "Certificates." They use a subtle light-blue background with a dark-navy border and a lock icon. Use monospace Geist for technical specs (e.g., `AES-256-GCM`) to reinforce the "engineered" nature of the security.

### Steppers & Wizards
Vertical steppers are preferred for inheritance setup. Use a "Pulse" indicator for the active step. Completed steps show a Success Green checkmark, while pending steps are rendered in a low-contrast gray outline.

### Bitcoin Specific UI
- **QR Codes:** Encased in a `rounded-2xl` white card with a generous 24px internal padding.
- **Heartbeat Indicators:** Small pill-shaped components with a soft-glowing animation to indicate "Sentinel Active" status.

### High-Fidelity Tables
Tables avoid heavy row borders. Instead, use alternating row tints or wide horizontal gutters. Column headers use `label-sm` typography. Timelines utilize a vertical "thread" metaphor with circular nodes indicating key inheritance milestones or check-ins.

### Buttons & Inputs
Primary buttons are solid Deep Navy or Bitcoin Orange. Secondary buttons are "Ghost" style with a 1px border. Input fields use a 1px border that thickens and changes to Bitcoin Orange on focus, accompanied by a very soft outer glow.