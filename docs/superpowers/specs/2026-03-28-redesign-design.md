# WeddingPlanner — Full UI Redesign & Mobile Support

**Date:** 2026-03-28
**Status:** Approved
**Scope:** CSS/styling overhaul + mobile layout restructuring (Approach A: responsive-first with layout switching)

---

## 1. Goals

- Give the app a warm, organic aesthetic that feels personal and beautiful — not a generic productivity tool
- Deliver full mobile parity (not a lite version) on screens ≤ 768px
- Add a bottom tab bar for mobile navigation
- Keep all existing functionality and data logic untouched

---

## 2. Design System

### 2.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#faf6f0` | Page background (warm parchment) |
| `--bg-2` | `#f2ebe1` | Secondary background, hover states |
| `--surface` | `#fffdf9` | Card surfaces |
| `--surface-strong` | `#ffffff` | Inputs, modals |
| `--line` | `#e4d9ce` | Borders (warm tan) |
| `--line-strong` | `#cfc0b0` | Stronger borders |
| `--text` | `#2c1f14` | Primary text (warm dark brown) |
| `--muted` | `#8a7060` | Secondary text |
| `--accent` | `#b85c3a` | Terracotta — primary actions, active states |
| `--accent-strong` | `#8c3d24` | Hover/pressed terracotta |
| `--accent-sage` | `#6b8f6e` | Sage green — secondary accent |
| `--danger` | `#c0392b` | Destructive actions |
| `--focus` | `rgba(184,92,58,0.18)` | Focus ring |
| `--shadow` | `0 12px 42px rgba(60,30,10,0.10)` | Card shadows (warm tint) |

### 2.2 Typography

- **Display/Headings:** Cormorant Garamond (already loaded) — romantic, editorial
- **Body:** DM Sans — warm, rounded, highly readable on mobile
- Load both from Google Fonts in `src/main.tsx`
- Body font stack: `"DM Sans", "Segoe UI", "Helvetica Neue", sans-serif`

### 2.3 Shape & Texture

- Card border-radius: `20px` (up from `18px`)
- Body background: warm cream-to-parchment gradient + very subtle CSS noise texture overlay
- Remove cold blue-tinted gradients throughout; replace with warm cream/sand gradients
- Badge colors updated to warm palette variants

---

## 3. Desktop Layout

No structural changes — stacked sections, full-width page. Visual refinements only:

- **Header:** warm cream background with soft terracotta-to-sage gradient wash; kicker color → terracotta; stats cards get warm sand backgrounds
- **Global actions:** primary actions (Open All, AI Assistant) right-aligned; AI Assistant as standout terracotta pill; secondary actions smaller/more muted
- **Section cards:** `linear-gradient(170deg, #fffdf9, #f8f2ea)` surfaces; warm tan borders
- **Data tables:** header row `#f5ede3`; row hover `rgba(184,92,58,0.04)`; sort indicators terracotta
- **Chat panel:** warm white background; user bubbles terracotta; assistant bubbles sage-tinted

---

## 4. Mobile Layout (≤ 768px)

### 4.1 Layout Mode Switch

A `useIsMobile` hook (`window.innerWidth <= 768` + resize listener) in `App.tsx` controls layout mode:

- **Desktop mode:** existing stacked-sections layout
- **Mobile mode:** single active section + bottom tab bar

### 4.2 Bottom Tab Bar

5 tabs, fixed to bottom of screen:

| Tab | Icon | Section |
|---|---|---|
| Home | 🏠 | Header stats + overview |
| Guests | 👥 | GuestsSection |
| Tasks | ✓ | TasksSection |
| Budget | 💰 | BudgetSection |
| More | ··· | Bottom sheet: Venues, Seating, Collaborators, Export, Sign Out |

**Styling:**
- Height: `64px` + `env(safe-area-inset-bottom)` for iPhone notch
- Background: `#fffdf9` with soft top border
- Active tab: terracotta icon + label + underline pill
- Inactive: `--muted` color

### 4.3 "More" Bottom Sheet

Tapping the More tab opens a bottom sheet overlay listing:
- Venues
- Seating (view-only mode)
- Collaborators
- Export / JSON
- Back to Workspaces
- Sign Out

### 4.4 Section View on Mobile

- Only the active tab's section renders
- Each section renders directly without the `CollapsibleSection` wrapper — always fully expanded
- Add-item forms: single column (already handled by existing breakpoints), rendered inline at the top of the section as usual

### 4.5 AI Assistant on Mobile

- Replaced by a floating terracotta chat bubble FAB (bottom-right, above tab bar)
- Tapping opens chat panel full-screen (100dvh) instead of a side panel

### 4.6 Seating Canvas on Mobile

- TablesSection detects mobile via `useIsMobile`
- Renders a read-only guest-per-table list instead of the drag canvas
- Edit prompt: "Open on desktop to edit seating arrangements"

---

## 5. Files to Change

| File | Change |
|---|---|
| `src/styles/app.css` | Full rewrite — new tokens, warm palette, mobile tab bar, FAB, bottom sheet, responsive overrides |
| `src/main.tsx` | Add Google Fonts link (DM Sans + Cormorant Garamond) |
| `src/App.tsx` | Add `useIsMobile`, `activeTab` state, bottom tab bar render, mobile routing, full-screen chat on mobile |
| `src/features/tables/TablesSection.tsx` | Detect mobile, render view-only list |

**No new dependencies. No changes to data logic, hooks, services, or types.**

---

## 6. Out of Scope (v1)

- Dark mode
- Animations / page transitions
- PWA / offline support
- Swipe gestures between tabs
- Mobile-optimized seating editor
