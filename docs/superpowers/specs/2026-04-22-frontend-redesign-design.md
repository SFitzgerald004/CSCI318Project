# Frontend Redesign — Design Spec

**Date:** 2026-04-22
**Status:** Approved, ready for implementation plan
**Scope:** Comprehensive Apple-inspired redesign across all 7 pages + 9 components, with design tokens and reusable component library.

---

## 1. Context and motivation

Meeting feedback flagged "more in-depth UI/UX" as a priority improvement. Phase 1 (backend tool calling) is complete, merged on the `backend` branch. The frontend currently has **partial** Apple-inspired styling — the color palette is mostly in place (`#0071e3`, `#1d1d1f`, `#f5f5f7`), but missing proper typography, navigation glass, functional icons, polished loading/empty states, and any visualization of the new `tools_used` data the backend returns.

This spec covers a comprehensive Apple-style redesign using the design system in the global `~/.claude/CLAUDE.md` reference, adapted to the TripBudget product.

### Goals

1. Apply a consistent, Apple-inspired visual system across all 7 pages.
2. Establish design tokens in Tailwind CSS v4 `@theme` so future changes cascade properly.
3. Build a small reusable component library (`src/components/ui/`) to eliminate JSX duplication.
4. Add missing interaction polish: skeleton loaders, empty states, error states, micro-animations.
5. Surface the Phase 1 tool-calling work visually via `tools_used` badges under AI messages.
6. Ship a responsive experience that works from 375px (iPhone SE) through 2560px (external monitor).

### Non-goals

- **No backend changes.** The response shape from Phase 1 is sufficient; frontend consumes what it already returns.
- **No new features requiring backend work.** Day-to-day itinerary, chat history persistence, feedback buttons — all deferred to Phase 2/3.
- **No flight or web-search integrations** — those land in Phase 2.
- **No framework migration.** Stays on React 19 + Tailwind CSS v4 + Vite.
- **No real SF Pro fonts.** Using Inter as the open-license substitute.

### Decisions locked in during brainstorming

| Decision | Choice | Rationale |
|---|---|---|
| Navigation pattern | Sidebar + glass treatment | Preserves IA for nested trip routes; adds Apple feel without structural rework |
| Typography | Inter (via Google Fonts) | Open license, cross-platform consistent, near-identical metrics to SF Pro |
| Icons | Heroicons for chrome, selective emoji as brand accents | Heroicons already installed; emoji kept for trip-purpose indicators only |
| AI transparency | Tiny badges under each AI message | Low implementation cost, immediately visible, matches Apple restraint |
| Scope | Maximum — tokens + component library + polish + animations | Comprehensive redesign demonstrates design discipline for grading |

---

## 2. Design tokens and foundation

### Tailwind CSS v4 `@theme` block

Expand `src/index.css` from 1 line to a full token system:

```css
@import "tailwindcss";
@import "./styles/fonts.css";

@theme {
  --color-apple-blue: #0071e3;
  --color-apple-blue-hover: #0077ed;
  --color-link-light: #0066cc;
  --color-link-dark: #2997ff;
  --color-text-primary: #1d1d1f;
  --color-text-secondary: rgba(0, 0, 0, 0.8);
  --color-text-tertiary: rgba(0, 0, 0, 0.48);
  --color-surface-light: #f5f5f7;
  --color-surface-dark-1: #272729;
  --color-surface-dark-2: #28282a;
  --color-surface-dark-3: #2a2a2d;

  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text",
               "Helvetica Neue", sans-serif;
  --font-display: "Inter Display", "Inter", -apple-system, sans-serif;

  --shadow-card: 3px 5px 30px 0 rgba(0, 0, 0, 0.22);
  --shadow-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.08);

  --radius-sm: 5px;
  --radius-md: 8px;
  --radius-lg: 11px;
  --radius-xl: 12px;
  --radius-pill: 980px;
}

body {
  font-family: var(--font-sans);
  font-feature-settings: "cv11", "ss01", "ss03";
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
  color: var(--color-text-primary);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Font loading — `src/styles/fonts.css` (new file)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Utility type classes (in `src/index.css`)

Only the type sizes actually used across the 7 pages — YAGNI applied:

```css
.type-display-hero    { font-family: var(--font-display); font-size: 3.5rem;  font-weight: 600; line-height: 1.07; letter-spacing: -0.028em; }
.type-section-heading { font-family: var(--font-display); font-size: 2.5rem;  font-weight: 600; line-height: 1.10; }
.type-tile-heading    { font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; line-height: 1.14; letter-spacing: 0.007em; }
.type-card-title      { font-family: var(--font-display); font-size: 1.31rem; font-weight: 700; line-height: 1.19; }
.type-body            { font-size: 1.06rem; font-weight: 400; line-height: 1.47; letter-spacing: -0.022em; }
.type-body-emphasis   { font-size: 1.06rem; font-weight: 600; line-height: 1.24; }
.type-caption         { font-size: 0.88rem; font-weight: 400; line-height: 1.29; letter-spacing: -0.013em; }
.type-micro           { font-size: 0.75rem; font-weight: 400; line-height: 1.33; }
```

---

## 3. Component library — `src/components/ui/`

Nine reusable primitives. Each is self-contained, tested independently, pure JSX.

### Directory structure

```
src/components/
├── ui/
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Modal.jsx
│   ├── Badge.jsx
│   ├── Skeleton.jsx
│   ├── EmptyState.jsx
│   └── ErrorState.jsx
└── (existing feature components — TripCard, Sidebar, etc.)
```

### The nine primitives

**`<Button variant size icon loading disabled type onClick>`**
- Variants: `primary`, `secondary`, `pill-outline`, `pill-filled`, `ghost`
- Sizes: `sm` (8px 15px), `md` (10px 20px), `lg` (12px 24px)
- `loading`: inline 14px spinner replaces text, button stays same width
- `icon`: Heroicon component rendered before text
- Focus: `ring-2 ring-apple-blue` on `:focus-visible`
- Press: scale(0.97) for 80ms on `:active`
- Replaces ~15 raw `<button>` elements

**`<Card variant padding hover elevated>`**
- Variants: `light` (surface-light bg), `white`, `dark-1`, `dark-2`
- `padding`: `sm` (16px) / `md` (20px) / `lg` (24px)
- `hover` (bool): shadow lift + `cursor-pointer`
- `elevated` (bool): opt-in `--shadow-card`
- Radius: 12px default

**`<Input label type placeholder value onChange error variant>`**
- Apple-style filled input: `bg-#fafafc` on light, `bg-surface-dark-2` on dark
- Borderless by default (CLAUDE.md: "don't use borders")
- Radius: 11px
- Focus: ring-apple-blue
- `error`: red helper text below
- `variant`: `light` / `dark` (for LoginPage/SignupPage)

**`<Select label options value onChange>`**
- Same visual treatment as `<Input>` plus `ChevronDownIcon`
- `options`: array of `{ value, label }` objects

**`<Modal open onClose title children>`**
- Overlay: `bg-black/50 backdrop-blur-sm`
- Panel: white, 12px radius, max-w-lg, animate-slide-up
- Closes on Escape, overlay click, or `<XMarkIcon>` button
- Traps focus internally, restores focus to trigger on close
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on title

**`<Badge variant children>`**
- Pill shape, fixed sizing (12px text, 2px/8px padding)
- Variants: `neutral`, `hotel`, `restaurant`, `attraction`, `flight`, `car-rental`, `ai-pick`, `tool-called`
- `tool-called`: `bg-apple-blue/8`, `text-apple-blue`, includes `CheckCircleIcon` at 12px

**`<Skeleton variant className>`**
- Shimmer rectangles with `@keyframes shimmer` linear-gradient sweep
- Variants: `text` (16px high), `title` (28px high), `card` (block, height via className), `circle`
- Animation: 1.5s infinite, respects `prefers-reduced-motion`

**`<EmptyState icon title description action>`**
- Centered layout, `py-16`, no border/card
- `icon`: React node (typically Heroicon at 48px, text-tertiary color)
- `title`: in type-card-title
- `description`: in type-caption
- `action`: optional React node (typically `<Button>`)

**`<ErrorState title description retry>`**
- Same shape as EmptyState but red-flavored
- `ExclamationTriangleIcon` in `text-red-500/60`
- `retry`: function → renders primary "Try again" Button

### Dependencies

Each primitive depends only on:
- React (obviously)
- `@heroicons/react/24/outline` (already installed)
- Tailwind classes that reference `@theme` tokens

No context, no data fetching, no router coupling.

### Testing

One `.test.jsx` file per primitive in `src/test/ui/`. Example shape:

```javascript
describe('<Button>', () => {
  it('renders children as label')
  it('calls onClick when clicked')
  it('does not call onClick when disabled')
  it('does not call onClick when loading')
  it('shows spinner element when loading')
  it('applies primary variant classes')
  it('applies secondary variant classes')
  it('renders leading icon when icon prop provided')
})
```

Target: 6-8 tests per primitive, ~60 total.

---

## 4. Page-by-page plan

### Shell — `Sidebar.jsx` + routing shell *(heavy)*

- Background: `bg-black/80 backdrop-blur-xl saturate-180` (glass)
- Logo: "TripBudget" in type-tile-heading 600 + `PaperAirplaneIcon` at 16px
- Nav links: Heroicons — `Squares2X2Icon`, `CalculatorIcon`, `SparklesIcon`, `BookmarkIcon`
- Active pill state unchanged (`bg-apple-blue`)
- Inactive: `text-white/60 hover:text-white hover:bg-white/5`
- Sign-out: `<Button variant="ghost" size="sm">`
- Sticky + responsive drawer on <640px (hamburger button, `translateX` animation)

### Page 1 — `LoginPage.jsx` *(light)*

- `<Input variant="dark">` primitives for email/password
- `<Button variant="primary" loading>`
- `PaperAirplaneIcon` above wordmark
- Type classes for wordmark + tagline

### Page 2 — `SignupPage.jsx` *(light)*

- Same treatment as LoginPage — sibling pages

### Page 3 — `TripsPage.jsx` *(heavy)*

- Header: `type-section-heading` title, `type-caption` subtitle, `<Button variant="primary" icon={PlusIcon}>`
- Grid: `<TripCard>` refactored, 24px gap
- Empty state: `<EmptyState icon={<PaperAirplaneIcon />} ...>`
- Loading: 6× `<Skeleton variant="card">` placeholders, min 300ms display
- Modal: all form JSX replaced with `<Modal>` + `<Input>`/`<Select>`/`<Button>`

### Page 4 — `TripDetailPage.jsx` *(light)*

- Overview card uses `<Card>` primitive
- Purpose emoji (🌴 💼 etc.) KEPT at top-right, 32px — the brand accent per Question 3
- Quick Actions row: 3× `<Button variant="pill-outline" icon>` links
- Alternating `bg-surface-light` / `bg-white` sections for CLAUDE.md cinematic pacing

### Page 5 — `BudgetPage.jsx` *(medium)*

- Pie chart wrapped in `<Card>`
- `<Button>` primitives for Generate/Regenerate
- Savings card: `<Card elevated>`, animated progress bar (600ms one-shot from 0 to current%)
- `<Input type="number">` for amount-saved
- Loading: `<Skeleton>` for chart + savings
- Error: `<ErrorState retry={fetchAllocation}>`

### Page 6 — `AiAdvisorPage.jsx` *(heavy — flagship)*

- Action row: 5 refactored `<AiInsightCard>`s with Heroicons (`ChartBarIcon`, `GlobeAltIcon`, `BuildingOffice2Icon`, `CakeIcon`, `MapPinIcon`)
- Card hover: scale(1.02) + shadow lift
- Click + loading: pulsing dot on the clicked card
- Chat panel `<AiChatPanel>` heavy rework:
  - Header: `ChatBubbleLeftEllipsisIcon` (replaces 💬)
  - User bubble right-aligned, `bg-surface-light`
  - AI bubble left-aligned, `bg-white` with subtle border
  - Avatar circles unchanged, add initials
  - **Tool badges:** `<ToolBadgeRow>` below each AI message with `tools_used.length > 0`
  - Thinking state: three-dot shimmer inside an AI-shaped bubble, staggered animation (0/150/300ms)
  - Inline save: `<Button variant="ghost" size="sm" icon={BookmarkIcon}>Save this</Button>` on AI messages from `handleRecommend` (not `handleAnalyze`)
- No-budget empty state: `<EmptyState icon={<ChartBarIcon />}>`
- Chat empty state: `<EmptyState icon={<SparklesIcon />}>`

### Page 7 — `RecommendationsPage.jsx` *(medium)*

- Title: `type-section-heading`
- Category filter: row of `<Button variant="pill-outline">`; active becomes `pill-filled`
- `<RecommendationCard>` refactored:
  - `<Badge variant={rec.category}>` for category
  - `<Badge variant="ai-pick">` for AI-pick tag
  - `<Button variant="ghost" size="sm">` for delete
- Empty state: `<EmptyState icon={<BookmarkIcon />}>`
- Loading: card skeletons

### Feature components summary

| Component | Change | Summary |
|---|---|---|
| `Sidebar` | heavy | Glass, Heroicons, responsive drawer |
| `TripCard` | medium | Card primitive, type tokens, keep purpose emoji |
| `BudgetChart` | light | Wrap in Card, recharts colors unchanged |
| `SavingsProgress` | light | Card primitive, animated progress fill |
| `AiChatPanel` | heavy | Right-align user, tool badges, inline save, shimmer |
| `AiInsightCard` | medium | Heroicons, hover scale, loading dot |
| `RecommendationCard` | medium | Badge primitives, ghost delete |
| `LoadingSpinner` | deleted | Replaced by Skeleton + inline Button spinner |
| `ProtectedRoute` | none | Router utility |

---

## 5. Interaction layer

### 5a. Loading state tiers

**Tier 1 — Skeletons** on page data fetches (TripsPage, BudgetPage, RecommendationsPage, TripDetailPage).
- `useDelayedLoading(loading: boolean, delayMs = 150): boolean` — returns `true` only if `loading` has been `true` for at least `delayMs`. Prevents flicker on fast responses.
- Once skeleton shows, it stays visible for a minimum of 300ms (prevents flash-and-gone)
- Shimmer: 1.5s infinite linear gradient sweep

**Tier 2 — Button spinner** for form submits / short actions.
- `<Button loading>` replaces text with 14px spinning circle
- Button width unchanged

**Tier 3 — Chat thinking** in AI Advisor.
- Three-dot shimmer inside an AI-shaped bubble
- Staggered animation (0/150/300ms delays, 0.8 → 1.0 → 0.8 scale, 0.9s loop)
- Bubble layout matches real AI response so swap is smooth

### 5b. Empty state — `<EmptyState>`

Used in 3 places (TripsPage, AiAdvisorPage, RecommendationsPage).

Visual structure:
```
[ Heroicon at 48px, text-tertiary ]
[ 12px gap ]
[ type-card-title title ]
[ 4px gap ]
[ type-caption description ]
[ 20px gap ]
[ optional <Button> action ]
```

Wrapped in centered div with `py-16`, no border or card.

### 5c. Error states

**Inline toasts** (react-hot-toast, kept) — for transient issues:
- Position: bottom-center
- Background: `bg-text-primary` near-black, white text, 8px radius, shadow-card
- Success: `CheckCircleIcon` + green icon theme `#34c759`
- Error: `ExclamationCircleIcon` + red icon theme `#ff3b30`
- Duration: 4s

**Full-page `<ErrorState>`** for route data failures:
- `ExclamationTriangleIcon` at 48px in `text-red-500/60`
- Title + description + `<Button>Try again</Button>` if retry provided

### 5d. Micro-animations (7 total)

| # | Animation | Where | Spec |
|---|---|---|---|
| 1 | Card hover lift | TripCard, AiInsightCard, RecommendationCard | `translate-y -2px` + shadow strengthen, 200ms ease-out |
| 2 | Button press | All `<Button>` | scale(0.97) on `:active`, 80ms |
| 3 | Modal slide-up | `<Modal>` | translate-y 20px→0 + opacity 0→1, 250ms ease-out |
| 4 | Badge stagger | `<ToolBadgeRow>` | Each badge fades/slides up with 50ms offset |
| 5 | Shimmer sweep | `<Skeleton>` | Linear gradient 1.5s infinite |
| 6 | Sidebar link hover | Sidebar items | Background 0→0.05 opacity, 150ms |
| 7 | Progress bar fill | `<SavingsProgress>` | 0% → current%, 600ms ease-out, one-shot on mount |

Not included: page route transitions, parallax, animated pie chart (recharts does its own).

**Accessibility:** global `prefers-reduced-motion` rule collapses all animations to 0.01ms.

### 5e. Tool badges — `<ToolBadgeRow>`

**Data flow:**
1. Backend returns `{advice, message_id, tools_used}` (Phase 1 shape).
2. `AiAdvisorPage` stores `tools_used` on each AI message: `{ role: 'ai', content, tools_used }`.
3. `AiChatPanel` renders `<ToolBadgeRow>` below each AI message where `tools_used.length > 0`.

**Label map — `src/config/toolLabels.js`:**
```javascript
export const TOOL_LABELS = {
  get_saved_recommendations: "Checked your saved items",
  get_savings_progress: "Reviewed savings progress",
  calculate_daily_spend: "Calculated daily spend",
}
```

Future tools added here as Phase 2 arrives.

**Visual:**
- Flex-wrap row, 8px gap, 6px top margin from chat bubble
- Each badge: `<Badge variant="tool-called">` with `CheckCircleIcon` at 12px + label text
- Colors: `bg-apple-blue/8`, `text-apple-blue`
- Deduplication: same tool name appearing multiple times renders once
- Unknown tool name falls back to the raw string (Phase 2 safety)

### 5f. Focus and keyboard behavior

- `:focus-visible` ring on all interactive elements: `ring-2 ring-apple-blue ring-offset-2`
- Modal traps focus, restores on close
- Escape closes modals
- Sidebar nav: ArrowDown/ArrowUp moves focus between links
- Form Enter submits; Shift+Tab navigates backward

---

## 6. File structure — final

### New files (13 source + 13 test = 26)

**Source (13):**
- `src/styles/fonts.css`
- `src/config/toolLabels.js`
- `src/hooks/useDelayedLoading.js`
- `src/components/ui/Button.jsx`
- `src/components/ui/Card.jsx`
- `src/components/ui/Input.jsx`
- `src/components/ui/Select.jsx`
- `src/components/ui/Modal.jsx`
- `src/components/ui/Badge.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/ui/EmptyState.jsx`
- `src/components/ui/ErrorState.jsx`
- `src/components/ToolBadgeRow.jsx`

**Test (13):** 9 `src/test/ui/*.test.jsx` (one per primitive) + 4 `src/test/*.test.jsx` (AiChatPanel, TripsPage, Sidebar, ToolBadgeRow)

### Modified files (17)

All 7 pages, all 7 remaining feature components (Sidebar, TripCard, BudgetChart, SavingsProgress, AiChatPanel, AiInsightCard, RecommendationCard), plus `src/index.css` and `src/App.jsx` (for Toaster config).

### Deleted files (1)

`src/components/LoadingSpinner.jsx` — replaced by `<Skeleton>` on pages and the loading prop on `<Button>`.

---

## 7. Responsive behavior

| Breakpoint | Width | Key layout changes |
|---|---|---|
| Mobile | <640px | Sidebar → hamburger drawer. Single-column grids. Modal full-width with 16px margins. `type-section-heading` 32px. Touch targets 44×44px min. |
| Tablet | 640-1024px | Sidebar fixed. 2-column grids. Modal 32rem max. Type full size. |
| Desktop | 1024-1440px | Sidebar 224px fixed. 3-column trip/rec grids. 5-column AiInsightCard row. |
| Large | >1440px | Content max 1200px centered. Generous outer margins. |

**Specific responsive details:**
- Sidebar drawer: `<Bars3Icon>` top-left triggers `transform: translateX(-100% → 0)` 250ms ease-out
- AiInsightCard row: 5 cards at desktop → 2-column grid at mobile (5th card spans full width)
- Create trip modal <640px: full-screen (`max-h-[100vh] rounded-none`)
- Chat bubbles: `max-w-[85%]` mobile, `max-w-[75%]` tablet+

**Manual QA breakpoints:**
- 375px (iPhone SE)
- 768px (iPad)
- 1440px (standard laptop)
- 2560px (external monitor)

---

## 8. Testing strategy

### Unit tests — `src/test/ui/`

One file per primitive, 6-8 tests each. Covers:
- Renders all variants correctly
- Callbacks fire on interaction (onClick, onChange)
- Disabled/loading prevents interaction
- Accessibility: focus ring, ARIA on Modal

Total: ~60 new unit tests.

### Integration tests — `src/test/`

| File | Focus |
|---|---|
| `AiChatPanel.test.jsx` (new) | Messages render, `tools_used` produces correct badges, dedup works, unknown tool falls back |
| `TripsPage.test.jsx` (updated) | Modal flow, empty state, skeleton during load |
| `Sidebar.test.jsx` (new) | Mobile drawer behavior, Escape/overlay close |
| `ToolBadgeRow.test.jsx` (new) | Unique rendering, label mapping, fallback |

~10 new integration tests.

### Not tested
- Animation timing (manual QA)
- Recharts rendering (trust the library)
- Firebase auth flow (pre-existing scope)
- Visual regression / screenshot diffs

### Tooling

Already installed: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`. No new dev dependencies.

---

## 9. Quality acceptance gates

Before calling the redesign "done":

1. `npm run lint` passes with zero errors
2. `npm test` passes (existing 28 + ~70 new = ~98 total frontend tests)
3. Manual responsive audit at 375px / 768px / 1440px — no horizontal scroll, no cramped touch targets
4. Keyboard navigation: every interactive element Tab-reachable, Modal traps focus, Escape closes modals
5. Color contrast: all text meets WCAG AA (verify with browser devtools spot check)
6. `prefers-reduced-motion` test: animations collapse when OS setting enabled
7. Golden-path smoke test end-to-end in Chrome + Safari:
   - Sign up, create a trip, generate budget, click Analyze Budget, see AI response with tool badges, save a recommendation
8. Backend test suite untouched — all 88 tests still pass (sanity check; frontend changes shouldn't affect backend)

---

## 10. Out of scope (Phase 2+)

Explicit non-goals so the plan doesn't sprawl:

- Web search tool (Phase 2)
- Flights API (Phase 2)
- Day-to-day itinerary feature (Phase 3)
- Feedback buttons on AI responses (Phase 3)
- AI chat history persistence (Phase 3)
- Route-transition animations
- Visual regression screenshot testing
- Storybook / design-system documentation site
- Dark mode toggle (palette is light-biased per CLAUDE.md; LoginPage/Sidebar are the only dark surfaces)
- i18n / localization

---

## 11. Success criteria

- Every page feels cohesive — consistent typography, spacing, color, iconography
- A new developer can read `src/components/ui/` and understand every primitive in under 5 minutes
- The `tools_used` badges visibly demonstrate Phase 1 tool-calling work to a grader
- Manual smoke test at 375px shows zero horizontal scroll and touchable targets
- Keyboard-only navigation works across every page
- Users with reduced-motion setting see a still interface
- Zero regression: backend tests green, existing frontend tests green, new tests green

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Inter CDN fetch fails or is slow | `font-display: swap` declared; fallback to `-apple-system` stack; worst case renders in system font |
| Tailwind v4 `@theme` syntax errors block all styling | Implement tokens in Task 1, test `npm run dev` renders before building anything else on top |
| Heroicon naming mismatches (wrong icon for wrong semantic) | Per-page icon choices listed in Section 4 are prescriptive; any divergence requires reopening spec |
| Component library abstraction creates more code than it saves | YAGNI applied aggressively — only 9 primitives extracted. Feature components (TripCard etc.) stay at top level |
| Responsive drawer on mobile conflicts with body scroll | Modal + drawer use `overflow: hidden` on `body` when open, restored on close — standard pattern |
| AI chat inline "Save this" button misparses AI response text | Accept that v1 uses the first line as the name; structured recommendation parsing is Phase 2+ |
| Animations feel janky on low-power devices | `prefers-reduced-motion` respected; all transitions capped at 250ms; hardware-accelerated transforms only |
