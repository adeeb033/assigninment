# Design Brief: Assignment Intelligence System

| Attribute | Value |
|-----------|-------|
| **Purpose** | Academic productivity tool — reduce cognitive load, signal priority visually |
| **Tone** | Premium minimal; authoritative yet calming; tech-credible |
| **Primary Mode** | Dark mode (late-night study pattern) |
| **Differentiation** | Urgency-driven color language (red/orange/amber/green) as structural motif, not decoration |
| **Aesthetic** | Clean, surgical, generous whitespace — Linear/Notion inspired |

## Color Palette

| Token | Light (OKLCH) | Dark (OKLCH) | Usage |
|-------|---|---|---|
| Primary | 0.42 0.05 250 (cool slate) | 0.75 0.08 275 | Navigation, CTAs, primary accent |
| Urgency: Critical | 0.55 0.22 25 (red) | 0.65 0.19 22 | Overdue, blocking tasks, high risk |
| Urgency: High | 0.62 0.2 34 (orange) | 0.62 0.18 32 | Urgent deadlines, 1–3 days |
| Urgency: Medium | 0.7 0.15 85 (amber) | 0.68 0.13 85 | Standard deadlines, 4–7 days |
| Urgency: Low | 0.58 0.18 130 (green) | 0.58 0.16 130 | Future deadlines, no risk |
| Background | 0.98 0 0 (near-white) | 0.12 0 0 (near-black) | Page background |
| Card | 1.0 0 0 (pure white) | 0.16 0 0 (charcoal) | Content containers |
| Border | 0.88 0 0 (light grey) | 0.25 0 0 (dark grey) | Separators, card edges, dividers |
| Foreground | 0.12 0 0 (near-black) | 0.95 0 0 (near-white) | Body text |
| Muted | 0.92 0 0 (light grey) | 0.2 0 0 (dark grey) | Disabled, secondary text, metadata |

## Typography

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Display/H1 | Bricolage Grotesque | 28–32px | 600–700 | Page titles, dashboard header |
| Heading/H2–H3 | Bricolage Grotesque | 18–24px | 600 | Section headers, card titles |
| Body | DM Sans | 14–16px | 400–500 | Content, descriptions, form text |
| Small/Caption | DM Sans | 12–13px | 400 | Timestamps, metadata, helper text |
| Mono | Geist Mono | 12–14px | 400 | Timers, urgency codes, data display |

## Structural Zones

| Zone | Background | Border | Treatment |
|------|------------|--------|-----------|
| **Navbar (Header)** | `--card` | `--border` (bottom) | Thin 1px border, `shadow-subtle` on dark |
| **Sidebar** | `--sidebar` | `--sidebar-border` (right) | Minimal, collapsible, 1px right border |
| **Main Content** | `--background` | None | Generous padding, grid-based card layout |
| **Card** | `--card` | 1px colored (urgency-based) | Rounded `lg` (10px), clean edges, no shadow |
| **Footer** (if used) | `--muted/20` | `--border` (top) | Minimal, right-aligned, small text |

## Component Patterns

- **Assignment Cards**: 4–6 column grid (mobile → 1, tablet → 2–3, desktop → 4–6). Border color indicates urgency. No shadows; rely on subtle border contrast.
- **Urgency Badges**: Small pills (height 24px), urgency text color on muted background, tight padding. No icons; text + number only.
- **Status Badges**: "In Progress", "Submitted", "Completed" as small discrete badges in `secondary-foreground` on `secondary` background.
- **Difficulty Stars**: 1–5 stars (★), muted color, tiny (14px).
- **Countdown Timer**: Mono font, compact; critical urgency triggers red text + blink (optional).
- **Buttons**: Minimal; primary button is solid primary color with white text, secondary is border-only, tertiary is text-only.
- **Inputs**: 1px border matching `--input`, rounded `md`, no shadow, focus ring matches `--ring`.

## Spacing & Rhythm

- **Base unit**: 4px
- **Card padding**: 16px (4 units)
- **Grid gap**: 12px (mobile), 16px (desktop)
- **Navbar height**: 56px
- **Sidebar width**: 240px (expanded), hidden (mobile)
- **Page margin**: 16px (mobile), 24px (tablet), 32px (desktop)

## Elevation & Depth

- **No gradients**. Depth via layer separation: navbar / sidebar / content / card borders.
- **Borders only**: All visual hierarchy via 1px color-matched borders, no box-shadows except subtle shadows on hover/focus states.
- **Hover states**: Border color brightens (L +0.05), background shifts to `muted/5`.

## Motion & Interaction

- **Transition default**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (smooth, not bouncy)
- **Focus state**: `ring` 2px, offset 2px
- **Loading state**: Skeleton loaders using `bg-muted/30` with shimmer (fade in/out at 1.5s interval)
- **Micro-interactions**: Card lift on hover (border brightens, slight lift via shadow-subtle)

## Anti-Patterns Avoided

- No purple/blue/pink default gradients
- No full-page background gradients
- No excessive shadows or glassmorphism
- No circular buttons or icons (use square/rounded-md)
- No animated entrance sequences on cards
- No rainbow color palette; 4-color urgency system only

## Signature Detail

**Urgency-driven card borders** — the card edge color immediately communicates priority. A student scanning the dashboard sees red edges = action required. This is the app's unique visual language, not found in generic productivity tools.
