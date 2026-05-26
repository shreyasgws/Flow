<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:flow-ui-bible -->
# Flow UI Alignment — Master Design System Prompt

## Critical Rules

1. **DO NOT rewrite core logic** (auth, Supabase, Zustand stores, sync, persistence, recurring, carry-forward). UI alignment only.
2. **Preserve all existing functionality**: task creation, drag/drop, completion, focus mode, recurring tasks, templates, reviews, categories, sync, offline mode, optimistic updates. Zero regressions.
3. **Follow the Flow Bible exactly** — emotional tone, spacing, typography, visual softness, motion philosophy, navigation behavior, atmospheric identity.

## Priority Order (when conflicts arise)

1. Stability
2. Functionality
3. Responsiveness
4. Accessibility
5. Emotional consistency
6. Visual polish
7. Animation complexity

Never sacrifice usability, performance, readability, or responsiveness for aesthetics.

## Global Visual Direction

**Feel**: calm, breathable, editorial, tactile, emotionally safe, premium, soft, atmospheric
**NEVER**: corporate, productivity-dashboard heavy, overly gamified, dense, sterile, sharp, aggressive, startup-like

## Typography

- **Fraunces** (serif) — ONLY for page titles, date headers, focus mode task titles, weekly summaries, emotionally important text. Never overuse.
- **DM Sans** (sans-serif) — body text, tasks, buttons, metadata, navigation, secondary info
- CSS vars: `--font-serif`, `--font-sans`

## Spacing Scale

Use consistently: `4 / 8 / 12 / 16 / 24 / 32`. Generous breathing room, clear vertical rhythm, no cramped layouts.

## Light Mode Colors (exact)

- `--bg-base: #F6F2EA`
- `--bg-surface: #FFFDF8`
- `--text-primary: #2B2925`
- `--border: #DED7CC`
- Feel: warm creams, muted surfaces, soft borders, editorial warmth — like a premium paper planner

## Dark Mode

- Immersive, atmospheric, deep, soft, cinematic
- Avoid neon glow, oversaturated accents, harsh contrast
- Use layered depth, subtle gradients, controlled bloom, restrained accent

## Task Card System

- Only checkbox + title visible by default
- Metadata hidden until hover/focus interaction
- Subtle hover/focus states, minimal borders, gentle elevation
- No dashboard density, excessive icons, visual clutter

## Input System

- Task textbox + visible add button (circular/pill, integrated into input row)
- Keyboard + touch support, smooth focus transitions, subtle active states
- Add button: integrated, soft, lightweight — not a generic CTA

## Button System

| Type | Style |
|------|-------|
| Primary | Muted indigo accent, medium radius, soft hover transitions, low elevation, subtle active press (`scale-97`) |
| Secondary | Transparent surfaces, warm borders, embedded/paper-like feel |
| Icon (btn-ghost) | 44×44 tap targets, low visual weight, hover scale 1.02, tap scale 0.97, no aggressive bounce |
| Add-task | Integrated into input row, soft circular/pill, subtle accent, tactile press feedback |

Button motion: 150–220ms, easeOut, low spring tension. No elastic bounce, flashy scaling, dramatic glows.

## Motion Philosophy

- Motion guides attention, softens transitions, creates continuity — almost invisible
- NOT flashy, constant, or "cool for the sake of cool"
- Consistent easing: easeOut, soft spring, low bounce
- Only ONE animated element commands attention at a time
- If background + cards + nav + particles all animate simultaneously → reduce motion

## Background System

- Core part of Flow's emotional identity — atmospheric, alive, subtle, immersive
- Allowed: soft drifting gradients, extremely slow opacity movement, subtle grain, low-motion particles, ambient blur, faint lighting shifts
- Forbidden: fast particles, constant motion, large floating objects, aggressive glow pulses, RGB gradients, animated wallpaper
- Particles: extremely low count, ultra slow movement, low opacity — like dust in light
- Gradients: 20–60s duration, very low opacity delta
- Performance: throttle on low FPS, pause when tab inactive, cleanup on unmount

## Navigation

- Simple, spatially coherent, calm
- Smooth transitions, clear active states, restrained icon animation, consistent bottom nav spacing
- SVG icons preferred over text characters

## Focus Mode

- Sacred, minimal, immersive
- No visual clutter, excessive controls, or analytics energy
- The task remains the emotional center

## Week View

- Reflective, editorial, spacious
- NOT analytics-heavy, graph-centric, or dashboard-like

## Reduced Motion

- Must disable particles, simplify gradients, remove ambient loops, reduce opacity animations
- App must still feel premium without motion

## Key Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | All CSS variables, button/task card classes, animation keyframes, device tiers |
| `src/app/layout.tsx` | Root layout, font loading (Fraunces + DM Sans + JetBrains Mono) |
| `src/components/task/TaskCard.tsx` | Task card with metadata hidden until hover |
| `src/components/home/InlineComposer.tsx` | Task input with integrated add button |
| `src/components/layout/BottomNav.tsx` | Navigation with SVG icons |
| `src/components/layout/Shell.tsx` | App shell, ambient layer, bottom nav |
| `src/components/section/SectionHeader.tsx` | Section header with hidden metadata |
| `src/components/ambient/AmbientLayer.tsx` | Ambient background with particles |
| `src/components/focus/` | Focus mode components |
| `src/components/weekly/` | Weekly view components |
| `src/app/page.tsx` | Landing page |
| `src/app/home/page.tsx` | Home page |
| `src/app/settings/page.tsx` | Settings page |
<!-- END:flow-ui-bible -->
