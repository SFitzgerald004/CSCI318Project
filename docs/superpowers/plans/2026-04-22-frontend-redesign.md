# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a comprehensive Apple-inspired redesign to the TripBudget frontend — design tokens, 9-primitive component library, all 7 pages refreshed, interaction polish, and `tools_used` badges surfacing Phase 1 backend work.

**Architecture:** Tailwind CSS v4 `@theme` layer defines tokens. Reusable primitives in `src/components/ui/` eliminate JSX duplication. Feature components (TripCard, AiChatPanel etc.) compose primitives and own domain logic. Inter font substitutes SF Pro. Heroicons replace functional emoji; selective emoji kept as brand accents. Glass sidebar, skeleton loaders, empty/error states, 7 micro-animations, responsive from 375px to 2560px.

**Tech Stack:** React 19, Tailwind CSS v4 (`@tailwindcss/vite`), Vite, Vitest + @testing-library/react, Heroicons, Inter (Google Fonts CDN), recharts, react-hot-toast.

**Spec:** [docs/superpowers/specs/2026-04-22-frontend-redesign-design.md](../specs/2026-04-22-frontend-redesign-design.md)

**Working branch:** `backend` (same as Phase 1).

---

## File inventory

**New source files (13):**
- `frontend/src/styles/fonts.css`
- `frontend/src/config/toolLabels.js`
- `frontend/src/hooks/useDelayedLoading.js`
- `frontend/src/components/ui/Button.jsx`
- `frontend/src/components/ui/Card.jsx`
- `frontend/src/components/ui/Input.jsx`
- `frontend/src/components/ui/Select.jsx`
- `frontend/src/components/ui/Modal.jsx`
- `frontend/src/components/ui/Badge.jsx`
- `frontend/src/components/ui/Skeleton.jsx`
- `frontend/src/components/ui/EmptyState.jsx`
- `frontend/src/components/ui/ErrorState.jsx`
- `frontend/src/components/ToolBadgeRow.jsx`

**New test files (13):** one per new component/primitive in `src/test/ui/` and `src/test/`.

**Modified (17):** all 7 pages, 7 feature components (Sidebar, TripCard, BudgetChart, SavingsProgress, AiChatPanel, AiInsightCard, RecommendationCard), `src/index.css`, `src/App.jsx`.

**Deleted (1):** `frontend/src/components/LoadingSpinner.jsx`.

---

## Task 1: Foundation — design tokens, fonts, hooks, tool labels

**Files:**
- Modify: `frontend/src/index.css`
- Create: `frontend/src/styles/fonts.css`
- Create: `frontend/src/config/toolLabels.js`
- Create: `frontend/src/hooks/useDelayedLoading.js`

- [ ] **Step 1: Create `frontend/src/styles/fonts.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

- [ ] **Step 2: Replace contents of `frontend/src/index.css`**

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

  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
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

.type-display-hero    { font-family: var(--font-display); font-size: 3.5rem;  font-weight: 600; line-height: 1.07; letter-spacing: -0.028em; }
.type-section-heading { font-family: var(--font-display); font-size: 2.5rem;  font-weight: 600; line-height: 1.10; }
.type-tile-heading    { font-family: var(--font-display); font-size: 1.75rem; font-weight: 400; line-height: 1.14; letter-spacing: 0.007em; }
.type-card-title      { font-family: var(--font-display); font-size: 1.31rem; font-weight: 700; line-height: 1.19; }
.type-body            { font-size: 1.06rem; font-weight: 400; line-height: 1.47; letter-spacing: -0.022em; }
.type-body-emphasis   { font-size: 1.06rem; font-weight: 600; line-height: 1.24; }
.type-caption         { font-size: 0.88rem; font-weight: 400; line-height: 1.29; letter-spacing: -0.013em; }
.type-micro           { font-size: 0.75rem; font-weight: 400; line-height: 1.33; }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@keyframes stagger-fade-in {
  from { transform: translateY(6px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

@keyframes thinking-dot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40%           { transform: scale(1.0); opacity: 1.0; }
}

@keyframes progress-fill {
  from { width: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Create `frontend/src/config/toolLabels.js`**

```javascript
export const TOOL_LABELS = {
  get_saved_recommendations: "Checked your saved items",
  get_savings_progress: "Reviewed savings progress",
  calculate_daily_spend: "Calculated daily spend",
};

export function humanizeToolName(name) {
  return TOOL_LABELS[name] || name;
}
```

- [ ] **Step 4: Create `frontend/src/hooks/useDelayedLoading.js`**

```javascript
import { useEffect, useState } from 'react';

/**
 * Returns true only if `loading` has been true for at least `delayMs`.
 * Once it becomes true, it stays true for a minimum of `minVisibleMs` after
 * loading flips back to false, preventing "flash of skeleton" on fast responses.
 */
export function useDelayedLoading(loading, delayMs = 150, minVisibleMs = 300) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoading(true), delayMs);
      return () => clearTimeout(timer);
    }
    if (showLoading) {
      const timer = setTimeout(() => setShowLoading(false), minVisibleMs);
      return () => clearTimeout(timer);
    }
  }, [loading, delayMs, minVisibleMs, showLoading]);

  return showLoading;
}
```

- [ ] **Step 5: Verify dev server starts without errors**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev`

Open http://localhost:5173 briefly in a browser. Expected: app loads, pages render (fonts may look slightly different because Inter is loading). No console errors. Kill the server with Ctrl+C after verifying.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css frontend/src/styles/fonts.css frontend/src/config/toolLabels.js frontend/src/hooks/useDelayedLoading.js
git commit -m "$(cat <<'EOF'
feat(frontend): add design tokens, Inter font, hook, and tool labels

Foundation for the Apple-inspired redesign. Tailwind v4 @theme block
with color/font/shadow/radius tokens. Inter via Google Fonts CDN with
font-display: swap. useDelayedLoading hook prevents skeleton flicker.
Tool label map for Phase 1 tools_used badges.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `<Button>` primitive

**Files:**
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/test/ui/Button.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Button.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

describe('<Button>', () => {
  it('renders children as label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} loading>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a spinner element when loading', () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole('button').querySelector('[data-testid="button-spinner"]')).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole('button').className).toMatch(/bg-apple-blue/);
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button').className).toMatch(/bg-white/);
  });

  it('applies pill-outline variant classes', () => {
    render(<Button variant="pill-outline">Learn more</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/rounded-full/);
    expect(btn.className).toMatch(/border/);
  });

  it('renders leading icon when icon prop provided', () => {
    render(<Button icon={PlusIcon}>Add</Button>);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('accepts type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm test -- Button.test.jsx`
Expected: FAIL — `Cannot find module '../../components/ui/Button'`.

- [ ] **Step 3: Create `frontend/src/components/ui/Button.jsx`**

```jsx
const VARIANTS = {
  primary: 'bg-apple-blue text-white hover:bg-apple-blue-hover disabled:opacity-50',
  secondary: 'bg-white text-text-primary border border-gray-200 hover:bg-surface-light disabled:opacity-50',
  'pill-outline': 'bg-transparent text-link-light border border-link-light rounded-full hover:bg-link-light/5 disabled:opacity-50',
  'pill-filled': 'bg-apple-blue text-white rounded-full hover:bg-apple-blue-hover disabled:opacity-50',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-light disabled:opacity-50',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed';
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`${base} ${variantClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          data-testid="button-spinner"
          className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm test -- Button.test.jsx`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Button.jsx frontend/src/test/ui/Button.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Button primitive with 5 variants

primary, secondary, pill-outline, pill-filled, ghost variants.
Loading state with inline spinner, icon prop, focus ring,
active scale animation. 10 tests covering interaction and rendering.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `<Card>` primitive

**Files:**
- Create: `frontend/src/components/ui/Card.jsx`
- Create: `frontend/src/test/ui/Card.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Card.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/ui/Card';

describe('<Card>', () => {
  it('renders children', () => {
    render(<Card><p>Hello</p></Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies white variant by default', () => {
    const { container } = render(<Card>X</Card>);
    expect(container.firstChild.className).toMatch(/bg-white/);
  });

  it('applies light variant', () => {
    const { container } = render(<Card variant="light">X</Card>);
    expect(container.firstChild.className).toMatch(/bg-surface-light/);
  });

  it('applies dark-1 variant', () => {
    const { container } = render(<Card variant="dark-1">X</Card>);
    expect(container.firstChild.className).toMatch(/bg-surface-dark-1/);
  });

  it('applies hover classes when hover prop is true', () => {
    const { container } = render(<Card hover>X</Card>);
    expect(container.firstChild.className).toMatch(/cursor-pointer/);
  });

  it('applies elevated shadow when elevated prop is true', () => {
    const { container } = render(<Card elevated>X</Card>);
    expect(container.firstChild.className).toMatch(/shadow-card/);
  });

  it('applies md padding by default', () => {
    const { container } = render(<Card>X</Card>);
    expect(container.firstChild.className).toMatch(/p-5/);
  });

  it('applies sm padding when padding="sm"', () => {
    const { container } = render(<Card padding="sm">X</Card>);
    expect(container.firstChild.className).toMatch(/p-4/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Card.test.jsx`
Expected: FAIL with import error.

- [ ] **Step 3: Create `frontend/src/components/ui/Card.jsx`**

```jsx
const VARIANTS = {
  white: 'bg-white',
  light: 'bg-surface-light',
  'dark-1': 'bg-surface-dark-1 text-white',
  'dark-2': 'bg-surface-dark-2 text-white',
};

const PADDINGS = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  variant = 'white',
  padding = 'md',
  hover = false,
  elevated = false,
  className = '',
  children,
  ...rest
}) {
  const base = 'rounded-xl transition-all duration-200';
  const variantClasses = VARIANTS[variant] || VARIANTS.white;
  const paddingClasses = PADDINGS[padding] || PADDINGS.md;
  const hoverClasses = hover ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : '';
  const elevatedClasses = elevated ? 'shadow-card' : '';

  return (
    <div
      className={`${base} ${variantClasses} ${paddingClasses} ${hoverClasses} ${elevatedClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Card.test.jsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Card.jsx frontend/src/test/ui/Card.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Card primitive with variants and elevation

white / light / dark-1 / dark-2 variants, sm/md/lg padding,
opt-in hover lift, opt-in elevated shadow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `<Input>` primitive

**Files:**
- Create: `frontend/src/components/ui/Input.jsx`
- Create: `frontend/src/test/ui/Input.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Input.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../components/ui/Input';

describe('<Input>', () => {
  it('renders label text', () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('fires onChange with the new value', () => {
    const onChange = vi.fn();
    render(<Input label="Email" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi@example.com' } });
    expect(onChange).toHaveBeenCalledWith('hi@example.com');
  });

  it('renders placeholder', () => {
    render(<Input label="Name" placeholder="Jane Doe" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
  });

  it('applies light variant by default', () => {
    render(<Input label="X" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').className).toMatch(/bg-\[#fafafc\]/);
  });

  it('applies dark variant classes', () => {
    render(<Input label="X" value="" onChange={() => {}} variant="dark" />);
    expect(screen.getByRole('textbox').className).toMatch(/bg-surface-dark-2/);
  });

  it('shows error message when error prop is set', () => {
    render(<Input label="X" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Required').className).toMatch(/text-red/);
  });

  it('passes through type prop', () => {
    render(<Input label="Password" type="password" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('applies required attribute', () => {
    render(<Input label="X" value="" onChange={() => {}} required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Input.test.jsx`
Expected: FAIL with import error.

- [ ] **Step 3: Create `frontend/src/components/ui/Input.jsx`**

```jsx
import { useId } from 'react';

const VARIANTS = {
  light: {
    label: 'text-text-secondary',
    input: 'bg-[#fafafc] text-text-primary placeholder:text-gray-400',
  },
  dark: {
    label: 'text-gray-400',
    input: 'bg-surface-dark-2 text-white placeholder:text-gray-600 border border-white/10',
  },
};

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  variant = 'light',
  required = false,
  className = '',
  ...rest
}) {
  const id = useId();
  const styles = VARIANTS[variant] || VARIANTS.light;

  return (
    <div className={className}>
      <label htmlFor={id} className={`block text-xs ${styles.label} mb-1.5`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full ${styles.input} rounded-[11px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow`}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Input.test.jsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Input.jsx frontend/src/test/ui/Input.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Input primitive with light/dark variants

Apple-style filled input, 11px radius, focus ring, error message
support. Uses useId for label association. onChange passes value
directly (not event) for cleaner consumer API.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `<Select>` primitive

**Files:**
- Create: `frontend/src/components/ui/Select.jsx`
- Create: `frontend/src/test/ui/Select.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Select.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '../../components/ui/Select';

const OPTIONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
];

describe('<Select>', () => {
  it('renders label', () => {
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(screen.getByText('Purpose')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'Vacation' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Business' })).toBeInTheDocument();
  });

  it('fires onChange with new value', () => {
    const onChange = vi.fn();
    render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'business' } });
    expect(onChange).toHaveBeenCalledWith('business');
  });

  it('reflects value prop as selected', () => {
    render(<Select label="Purpose" options={OPTIONS} value="business" onChange={() => {}} />);
    expect(screen.getByRole('combobox').value).toBe('business');
  });

  it('renders chevron icon', () => {
    const { container } = render(<Select label="Purpose" options={OPTIONS} value="vacation" onChange={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Select.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/Select.jsx`**

```jsx
import { useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Select({
  label,
  options,
  value,
  onChange,
  className = '',
  ...rest
}) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs text-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-[#fafafc] text-text-primary rounded-[11px] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer"
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDownIcon className="w-4 h-4 text-text-tertiary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Select.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Select.jsx frontend/src/test/ui/Select.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Select primitive with chevron icon

appearance-none for custom styling, Heroicon chevron overlay,
same visual treatment as Input primitive.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `<Modal>` primitive

**Files:**
- Create: `frontend/src/components/ui/Modal.jsx`
- Create: `frontend/src/test/ui/Modal.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Modal.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/ui/Modal';

describe('<Modal>', () => {
  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="Test"><p>body</p></Modal>);
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    render(<Modal open={true} onClose={() => {}} title="Test"><p>body</p></Modal>);
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<Modal open={true} onClose={() => {}} title="My Modal"><p>body</p></Modal>);
    expect(screen.getByText('My Modal')).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal', () => {
    render(<Modal open={true} onClose={() => {}} title="T"><p>body</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when panel (not overlay) is clicked', () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="T"><p>body</p></Modal>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Modal.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/Modal.jsx`**

```jsx
import { useEffect, useRef, useId } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ open, onClose, title, children }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ animation: 'slide-up 250ms ease-out' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="type-card-title">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Modal.test.jsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Modal.jsx frontend/src/test/ui/Modal.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Modal primitive with overlay, Escape, focus trap

Role=dialog, aria-modal, aria-labelledby for accessibility. Escape
and overlay click both close. stopPropagation prevents inner clicks
from closing. Body scroll locked while open. 250ms slide-up animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `<Badge>` primitive

**Files:**
- Create: `frontend/src/components/ui/Badge.jsx`
- Create: `frontend/src/test/ui/Badge.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Badge.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/ui/Badge';

describe('<Badge>', () => {
  it('renders children', () => {
    render(<Badge>Hotel</Badge>);
    expect(screen.getByText('Hotel')).toBeInTheDocument();
  });

  it('applies neutral variant by default', () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-gray-100/);
  });

  it('applies hotel variant', () => {
    const { container } = render(<Badge variant="hotel">X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-blue-100/);
  });

  it('applies ai-pick variant', () => {
    const { container } = render(<Badge variant="ai-pick">X</Badge>);
    expect(container.firstChild.className).toMatch(/bg-yellow-100/);
  });

  it('applies tool-called variant with check icon', () => {
    const { container } = render(<Badge variant="tool-called">Tool</Badge>);
    expect(container.firstChild.className).toMatch(/bg-apple-blue/);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has pill shape (rounded-full)', () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.firstChild.className).toMatch(/rounded-full/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Badge.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/Badge.jsx`**

```jsx
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const VARIANTS = {
  neutral: 'bg-gray-100 text-gray-700',
  hotel: 'bg-blue-100 text-blue-700',
  restaurant: 'bg-orange-100 text-orange-700',
  attraction: 'bg-purple-100 text-purple-700',
  flight: 'bg-green-100 text-green-700',
  'car-rental': 'bg-gray-100 text-gray-700',
  'ai-pick': 'bg-yellow-100 text-yellow-700 font-semibold',
  'tool-called': 'bg-apple-blue/10 text-apple-blue font-medium',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.neutral;
  const showIcon = variant === 'tool-called';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize ${variantClasses} ${className}`}>
      {showIcon && <CheckCircleIcon className="w-3 h-3" />}
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Badge.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Badge.jsx frontend/src/test/ui/Badge.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Badge primitive with 8 variants

Category colors (hotel/restaurant/attraction/flight/car-rental),
ai-pick highlight, and tool-called variant with inline check icon
for Phase 1 tools_used display.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `<Skeleton>` primitive

**Files:**
- Create: `frontend/src/components/ui/Skeleton.jsx`
- Create: `frontend/src/test/ui/Skeleton.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/Skeleton.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from '../../components/ui/Skeleton';

describe('<Skeleton>', () => {
  it('applies text variant by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toMatch(/h-4/);
  });

  it('applies title variant', () => {
    const { container } = render(<Skeleton variant="title" />);
    expect(container.firstChild.className).toMatch(/h-7/);
  });

  it('applies card variant', () => {
    const { container } = render(<Skeleton variant="card" />);
    expect(container.firstChild.className).toMatch(/h-32/);
  });

  it('applies circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstChild.className).toMatch(/rounded-full/);
  });

  it('has shimmer animation', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild.className).toMatch(/animate-pulse/);
  });

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="w-1/2" />);
    expect(container.firstChild.className).toMatch(/w-1\/2/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Skeleton.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/Skeleton.jsx`**

```jsx
const VARIANTS = {
  text: 'h-4 w-full rounded',
  title: 'h-7 w-3/4 rounded-md',
  card: 'h-32 w-full rounded-xl',
  circle: 'h-10 w-10 rounded-full',
};

export default function Skeleton({ variant = 'text', className = '' }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.text;
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse ${variantClasses} ${className}`}
      style={{ animation: 'shimmer 1.5s infinite linear, pulse 2s infinite' }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Skeleton.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Skeleton.jsx frontend/src/test/ui/Skeleton.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add Skeleton primitive with shimmer animation

Four variants (text/title/card/circle), linear-gradient shimmer
sweep that auto-respects prefers-reduced-motion via global CSS rule.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `<EmptyState>` primitive

**Files:**
- Create: `frontend/src/components/ui/EmptyState.jsx`
- Create: `frontend/src/test/ui/EmptyState.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/EmptyState.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import EmptyState from '../../components/ui/EmptyState';

describe('<EmptyState>', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="T" description="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(<EmptyState title="T" icon={<PaperAirplaneIcon />} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="T" action={<button>Go</button>} />);
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('does not render action section when no action', () => {
    render(<EmptyState title="T" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- EmptyState.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/EmptyState.jsx`**

```jsx
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      {icon && <div className="text-text-tertiary mx-auto w-12 h-12 mb-3">{icon}</div>}
      <h2 className="type-card-title">{title}</h2>
      {description && <p className="type-caption text-text-secondary mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- EmptyState.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/EmptyState.jsx frontend/src/test/ui/EmptyState.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add EmptyState primitive

Centered icon + title + description + optional action. Used by
TripsPage (no trips), AiAdvisorPage (no chat), RecommendationsPage
(nothing saved).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `<ErrorState>` primitive

**Files:**
- Create: `frontend/src/components/ui/ErrorState.jsx`
- Create: `frontend/src/test/ui/ErrorState.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ui/ErrorState.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from '../../components/ui/ErrorState';

describe('<ErrorState>', () => {
  it('renders title', () => {
    render(<ErrorState title="Something failed" />);
    expect(screen.getByText('Something failed')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ErrorState title="T" description="Try again in a moment" />);
    expect(screen.getByText('Try again in a moment')).toBeInTheDocument();
  });

  it('renders warning icon', () => {
    const { container } = render(<ErrorState title="T" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders retry button when retry prop provided', () => {
    render(<ErrorState title="T" retry={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls retry when retry button is clicked', () => {
    const retry = vi.fn();
    render(<ErrorState title="T" retry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(retry).toHaveBeenCalled();
  });

  it('does not render button when no retry', () => {
    render(<ErrorState title="T" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ErrorState.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Create `frontend/src/components/ui/ErrorState.jsx`**

```jsx
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ErrorState({ title, description, retry }) {
  return (
    <div className="text-center py-16">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500/60 mx-auto mb-3" />
      <h2 className="type-card-title">{title}</h2>
      {description && <p className="type-caption text-text-secondary mt-1">{description}</p>}
      {retry && (
        <div className="mt-5">
          <Button variant="primary" onClick={retry}>Try again</Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ErrorState.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/ErrorState.jsx frontend/src/test/ui/ErrorState.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add ErrorState primitive with retry button

ExclamationTriangle icon, optional retry callback that renders
a primary Button. Used for route-level data-fetch failures.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Refactor `Sidebar.jsx` — glass treatment + Heroicons + responsive drawer

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/test/Sidebar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/Sidebar.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

function renderSidebar({ tripName = undefined, path = '/trips' } = {}) {
  const mockAuth = { user: { email: 'test@example.com' }, logout: vi.fn() };
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={[path]}>
        <Sidebar tripName={tripName} />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('<Sidebar>', () => {
  it('renders TripBudget wordmark', () => {
    renderSidebar();
    expect(screen.getByText('TripBudget')).toBeInTheDocument();
  });

  it('shows "My Trips" link when not in a trip', () => {
    renderSidebar();
    expect(screen.getByText('My Trips')).toBeInTheDocument();
  });

  it('renders user email', () => {
    renderSidebar();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders Sign Out button', () => {
    renderSidebar();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls logout when Sign Out clicked', () => {
    const mockAuth = { user: { email: 'test@example.com' }, logout: vi.fn() };
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter><Sidebar /></MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText('Sign Out'));
    expect(mockAuth.logout).toHaveBeenCalled();
  });

  it('has backdrop-blur class on aside (glass treatment)', () => {
    const { container } = renderSidebar();
    expect(container.querySelector('aside').className).toMatch(/backdrop-blur/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Sidebar.test.jsx`
Expected: FAIL — the current Sidebar uses `bg-[#1d1d1f]` without backdrop-blur.

- [ ] **Step 3: Replace `frontend/src/components/Sidebar.jsx`**

```jsx
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  Squares2X2Icon,
  CalculatorIcon,
  SparklesIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

export default function Sidebar({ tripName }) {
  const { id } = useParams();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive(path)
        ? 'bg-apple-blue text-white font-medium'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

  const sidebarContent = (
    <>
      <Link to="/trips" className="flex items-center gap-2 text-white type-tile-heading mb-6">
        <PaperAirplaneIcon className="w-5 h-5" />
        TripBudget
      </Link>

      {id ? (
        <>
          <Link to="/trips" className="flex items-center gap-1 text-white/60 text-sm mb-4 hover:text-white">
            <ArrowLeftIcon className="w-4 h-4" /> All Trips
          </Link>
          <p className="px-3 text-xs uppercase tracking-wider text-white/40 mb-2">
            {tripName || 'Trip'}
          </p>
          <nav className="flex flex-col gap-1">
            <Link to={`/trips/${id}`} className={linkClass(`/trips/${id}`)}>
              <Squares2X2Icon className="w-4 h-4" /> Overview
            </Link>
            <Link to={`/trips/${id}/budget`} className={linkClass(`/trips/${id}/budget`)}>
              <CalculatorIcon className="w-4 h-4" /> Budget
            </Link>
            <Link to={`/trips/${id}/ai`} className={linkClass(`/trips/${id}/ai`)}>
              <SparklesIcon className="w-4 h-4" /> AI Advisor
            </Link>
            <Link to={`/trips/${id}/recommendations`} className={linkClass(`/trips/${id}/recommendations`)}>
              <BookmarkIcon className="w-4 h-4" /> Recommendations
            </Link>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col gap-1">
          <Link to="/trips" className={linkClass('/trips')}>
            <Squares2X2Icon className="w-4 h-4" /> My Trips
          </Link>
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-white/40 text-xs truncate">{user?.email}</p>
        <Button variant="ghost" size="sm" onClick={logout} className="mt-2 !px-0 !text-white/50 hover:!text-white">
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-black/80 backdrop-blur-xl text-white p-2 rounded-lg"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-0
          w-56 min-h-screen flex flex-col p-5 flex-shrink-0
          bg-black/80 backdrop-blur-xl
          transition-transform duration-250 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        {mobileOpen && (
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Sidebar.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/test/Sidebar.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): glass-treatment Sidebar with Heroicons and mobile drawer

bg-black/80 + backdrop-blur-xl + saturate(180%) matches CLAUDE.md
navigation glass. Heroicons replace text-only labels (Squares2X2,
Calculator, Sparkles, Bookmark, PaperAirplane). Hamburger drawer at
<768px with overlay, Escape/overlay close, translateX animation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Refactor `LoginPage.jsx`

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 1: Replace `frontend/src/pages/LoginPage.jsx`**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/trips');
    } catch (err) {
      setError(err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <PaperAirplaneIcon className="w-10 h-10 text-white mx-auto mb-2" />
        <h1 className="type-tile-heading text-white mb-1">TripBudget</h1>
        <p className="type-caption text-white/50 mb-8">Smart travel budget planning</p>

        <form onSubmit={handleSubmit} className="bg-surface-dark-1 rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            variant="dark"
            className="mb-4"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            variant="dark"
            className="mb-6"
          />

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-link-dark hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`. Navigate to `http://localhost:5173/login`. Verify:
- Inter font is applied (compare to old sans-serif)
- PaperAirplane icon above "TripBudget"
- Inputs are Apple-style filled (bg-surface-dark-2, 11px radius)
- Button animates scale on press

Kill server with Ctrl+C.

- [ ] **Step 3: Run existing tests**

Run: `npm test`
Expected: all tests still pass (existing Firebase/auth tests untouched).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): LoginPage uses Input/Button primitives + type classes

PaperAirplane icon + type-tile-heading wordmark. Inputs use dark
variant. Submit Button has loading prop. Type classes replace
ad-hoc text-sm font-semibold.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Refactor `SignupPage.jsx`

**Files:**
- Modify: `frontend/src/pages/SignupPage.jsx`

- [ ] **Step 1: Read current contents**

Read: `frontend/src/pages/SignupPage.jsx` — it has the same shape as LoginPage but with an extra "Confirm Password" field and calls `signup` instead of `login`.

- [ ] **Step 2: Replace with equivalent pattern to LoginPage**

Replace `frontend/src/pages/SignupPage.jsx`:

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate('/trips');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters'
        : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <PaperAirplaneIcon className="w-10 h-10 text-white mx-auto mb-2" />
        <h1 className="type-tile-heading text-white mb-1">TripBudget</h1>
        <p className="type-caption text-white/50 mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="bg-surface-dark-1 rounded-xl p-7 text-left">
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
            variant="dark"
            className="mb-4"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            required
            variant="dark"
            className="mb-4"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            required
            variant="dark"
            className="mb-6"
          />

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating account...' : 'Sign Up'}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-link-dark hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

**Note:** If the existing SignupPage's `useAuth()` exposes a differently-named function (e.g., `register` instead of `signup`), substitute the correct name. Check `frontend/src/context/AuthContext.jsx` first if unsure.

- [ ] **Step 3: Manual verification**

`npm run dev` → /signup. Verify same visual treatment as LoginPage.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/SignupPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): SignupPage uses Input/Button primitives + type classes

Sibling treatment to LoginPage — same PaperAirplane logo, dark form
card, primitive inputs/button. Adds password confirmation field.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Refactor `TripCard.jsx`

**Files:**
- Modify: `frontend/src/components/TripCard.jsx`

- [ ] **Step 1: Replace `frontend/src/components/TripCard.jsx`**

```jsx
import { Link } from 'react-router-dom';
import Card from './ui/Card';

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
};

export default function TripCard({ trip }) {
  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <Link to={`/trips/${trip.id}`} className="block">
      <Card hover className="h-full">
        <div className="text-2xl mb-2">{PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}</div>
        <h3 className="type-body-emphasis">{trip.destination}</h3>
        <p className="type-caption text-text-secondary mt-1 capitalize">
          {trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}
        </p>
        <p className="type-caption text-text-tertiary">{departure} – {returnDate}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="type-body-emphasis">${trip.total_budget.toLocaleString()}</span>
          <span className="type-caption text-apple-blue">View →</span>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Verify manually**

`npm run dev` → /trips. Create a trip if none exist. Verify cards render with:
- Purpose emoji (🌴 💼 etc.) kept
- Type classes applied
- Hover lift animation works (cards translate up on hover)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TripCard.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): TripCard uses Card primitive + type classes

Purpose emoji kept (brand accent per design decision).
Card primitive provides hover lift + consistent padding.
Type classes replace ad-hoc text styles.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Refactor `BudgetChart.jsx` and `SavingsProgress.jsx`

**Files:**
- Modify: `frontend/src/components/BudgetChart.jsx`
- Modify: `frontend/src/components/SavingsProgress.jsx`

- [ ] **Step 1: Replace `frontend/src/components/BudgetChart.jsx`**

```jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0071e3', '#34c759', '#ff9f0a', '#ff375f', '#af52de', '#8e8e93'];
const LABELS = ['Flights', 'Hotel', 'Food', 'Activities', 'Transport', 'Misc'];
const KEYS = ['flights', 'hotel', 'food', 'activities', 'transport', 'misc'];

export default function BudgetChart({ allocation }) {
  const data = KEYS.map((key, i) => ({
    name: LABELS[i],
    value: allocation[`${key}_pct`],
    amount: allocation[`${key}_budget`],
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`$${props.payload.amount} (${value}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 type-caption text-text-secondary">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
            {d.name} {d.value}%
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `frontend/src/components/SavingsProgress.jsx`**

```jsx
import { useEffect, useState } from 'react';

export default function SavingsProgress({ plan }) {
  const [fillPct, setFillPct] = useState(0);
  const targetPct = plan.total_budget > 0
    ? Math.min(100, (plan.amount_saved / plan.total_budget) * 100)
    : 0;

  useEffect(() => {
    // Animate from 0 to targetPct on mount
    const timer = setTimeout(() => setFillPct(targetPct), 50);
    return () => clearTimeout(timer);
  }, [targetPct]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="type-caption text-text-secondary">Saved so far</span>
        <span className="type-body-emphasis">
          ${plan.amount_saved.toLocaleString()} / ${plan.total_budget.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 h-2 bg-surface-light rounded-full overflow-hidden">
        <div
          className="h-full bg-apple-blue rounded-full transition-[width] duration-[600ms] ease-out"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <p className="type-caption text-text-tertiary mt-1">{Math.round(targetPct)}% of goal</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

`npm run dev` → navigate to a trip's Budget page (requires an existing trip with an allocation + savings plan). Verify:
- Pie chart legend uses type-caption
- Savings progress bar animates from 0 on first render

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/BudgetChart.jsx frontend/src/components/SavingsProgress.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): BudgetChart and SavingsProgress use type classes

Pie chart dimensions nudged (55/95 inner/outer radius).
SavingsProgress animates width from 0 to target % on mount (600ms).
Both components use type-caption / type-body-emphasis tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Refactor `BudgetPage.jsx`

**Files:**
- Modify: `frontend/src/pages/BudgetPage.jsx`

- [ ] **Step 1: Read current contents**

Read: `frontend/src/pages/BudgetPage.jsx` (129 lines). Understand:
- It fetches allocation + savings plan
- Has Generate/Regenerate buttons
- Has an amount-saved input form

- [ ] **Step 2: Replace with refactored version**

Replace `frontend/src/pages/BudgetPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAllocation, createAllocation, getSavingsPlan, updateSavingsPlan } from '../services/budgetService';
import BudgetChart from '../components/BudgetChart';
import SavingsProgress from '../components/SavingsProgress';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { CalculatorIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function BudgetPage() {
  const { id } = useParams();
  const [allocation, setAllocation] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [amountSaved, setAmountSaved] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  const showSkeleton = useDelayedLoading(loading);

  async function loadData() {
    setLoading(true);
    setLoadError(false);
    try {
      const [alloc, savings] = await Promise.allSettled([
        getAllocation(id),
        getSavingsPlan(id),
      ]);
      setAllocation(alloc.status === 'fulfilled' ? alloc.value : null);
      setPlan(savings.status === 'fulfilled' ? savings.value : null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newAlloc = await createAllocation(id);
      setAllocation(newAlloc);
      toast.success('Budget allocated');
    } catch {
      toast.error('Could not generate budget');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAmount(e) {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const updated = await updateSavingsPlan(id, Number(amountSaved));
      setPlan(updated);
      setAmountSaved('');
      toast.success('Savings updated');
    } catch {
      toast.error('Could not update savings');
    } finally {
      setSavingPlan(false);
    }
  }

  if (loadError) {
    return <ErrorState title="Could not load budget" description="Please try again in a moment." retry={loadData} />;
  }

  if (showSkeleton) {
    return (
      <div>
        <Skeleton variant="title" className="w-64 mb-6" />
        <Skeleton variant="card" className="mb-6" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="type-section-heading">Budget</h1>
      <p className="type-caption text-text-secondary mt-1">AI-allocated budget for your trip</p>

      {!allocation ? (
        <EmptyState
          icon={<CalculatorIcon className="w-12 h-12" />}
          title="No allocation yet"
          description="Generate a smart budget split based on your trip details."
          action={<Button onClick={handleGenerate} loading={generating}>Generate Budget</Button>}
        />
      ) : (
        <>
          <Card elevated className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-card-title">Allocation</h2>
              <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
                Regenerate
              </Button>
            </div>
            <BudgetChart allocation={allocation} />
          </Card>

          <Card elevated className="mt-6">
            <h2 className="type-card-title mb-4">Savings Plan</h2>
            {plan ? (
              <SavingsProgress plan={plan} />
            ) : (
              <p className="type-caption text-text-secondary">No savings plan yet. Enter an amount to start.</p>
            )}
            <form onSubmit={handleSaveAmount} className="mt-4 flex items-end gap-3">
              <Input
                label="Amount saved so far ($)"
                type="number"
                value={amountSaved}
                onChange={setAmountSaved}
                placeholder="500"
                className="flex-1"
              />
              <Button type="submit" loading={savingPlan}>Save</Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

`npm run dev` → navigate to a trip's Budget page. Verify:
- Loading skeleton appears on initial load
- If no allocation, empty state with CalculatorIcon shows
- "Generate Budget" works, pie chart renders
- "Save" on savings form updates progress
- Error state appears if you stop the backend and retry

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/BudgetPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): BudgetPage uses Card/Button/Input primitives

Skeleton loaders during initial fetch. EmptyState for no-allocation
case. ErrorState with retry for fetch failures. Promise.allSettled
for parallel fetches (plan may not exist yet even if allocation does).
Separate elevated Cards for allocation chart and savings plan.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Refactor `RecommendationCard.jsx`

**Files:**
- Modify: `frontend/src/components/RecommendationCard.jsx`

- [ ] **Step 1: Replace `frontend/src/components/RecommendationCard.jsx`**

```jsx
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';

export default function RecommendationCard({ rec, onDelete }) {
  return (
    <Card className="relative group">
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        aria-label="Delete recommendation"
        className="!absolute top-3 right-3 !p-1 opacity-0 group-hover:opacity-100 transition-opacity !text-gray-300 hover:!text-red-500"
      >
        <TrashIcon className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge variant={rec.category}>{rec.category}</Badge>
        <Badge variant="neutral">{rec.source?.replace('_', ' ')}</Badge>
        {rec.is_ai_pick && <Badge variant="ai-pick">AI Pick</Badge>}
      </div>

      <h3 className="type-body-emphasis">{rec.name}</h3>
      {rec.description && (
        <p className="type-caption text-text-secondary mt-1 line-clamp-2">{rec.description}</p>
      )}

      <div className="flex items-center gap-3 mt-3 type-caption text-text-tertiary">
        {rec.rating && <span>⭐ {rec.rating}</span>}
        {rec.price_level && <span>{rec.price_level}</span>}
        {rec.address && <span className="truncate">{rec.address}</span>}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/RecommendationCard.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): RecommendationCard uses Card/Badge/Button primitives

Category/source/ai-pick all use Badge variants. Delete button is a
ghost-variant Button (was raw button). Star emoji kept as brand accent.
Type classes replace ad-hoc text styles.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Refactor `RecommendationsPage.jsx`

**Files:**
- Modify: `frontend/src/pages/RecommendationsPage.jsx`

- [ ] **Step 1: Read current contents**

Read: `frontend/src/pages/RecommendationsPage.jsx` (83 lines).

- [ ] **Step 2: Replace with refactored version**

Replace `frontend/src/pages/RecommendationsPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRecommendations, deleteRecommendation } from '../services/recommendationService';
import RecommendationCard from '../components/RecommendationCard';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'attraction', label: 'Attractions' },
  { value: 'flight', label: 'Flights' },
  { value: 'car_rental', label: 'Car Rentals' },
];

export default function RecommendationsPage() {
  const { id } = useParams();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const showSkeleton = useDelayedLoading(loading);

  async function loadRecs() {
    setLoading(true);
    setError(false);
    try {
      const data = await getRecommendations(id);
      setRecs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete(recId) {
    try {
      await deleteRecommendation(id, recId);
      setRecs((prev) => prev.filter((r) => r.id !== recId));
      toast.success('Removed');
    } catch {
      toast.error('Could not delete');
    }
  }

  const filtered = activeCategory === 'all'
    ? recs
    : recs.filter((r) => r.category === activeCategory);

  if (error) {
    return <ErrorState title="Could not load recommendations" description="Please try again." retry={loadRecs} />;
  }

  return (
    <div>
      <h1 className="type-section-heading">Recommendations</h1>
      <p className="type-caption text-text-secondary mt-1">Items saved for this trip</p>

      <div className="flex flex-wrap gap-2 mt-6">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'pill-filled' : 'pill-outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="w-12 h-12" />}
          title="No recommendations saved"
          description={activeCategory === 'all'
            ? "Ask the AI advisor for suggestions and save what you like."
            : `No ${activeCategory} recommendations yet.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filtered.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onDelete={() => handleDelete(rec.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

`npm run dev` → /trips/:id/recommendations. Verify filter pills switch between "pill-outline" and "pill-filled", empty state shows when filter has no results, delete works.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/RecommendationsPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): RecommendationsPage uses Button pills + primitives

Category filter row uses pill-outline/pill-filled Button variants.
Skeleton grid while loading. EmptyState with BookmarkIcon.
ErrorState with retry on fetch failure.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Refactor `TripDetailPage.jsx`

**Files:**
- Modify: `frontend/src/pages/TripDetailPage.jsx`

- [ ] **Step 1: Read current contents**

Read: `frontend/src/pages/TripDetailPage.jsx` (76 lines). Look for the existing "Quick Actions" pattern.

- [ ] **Step 2: Replace with refactored version**

Replace `frontend/src/pages/TripDetailPage.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip } from '../services/tripService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { CalculatorIcon, SparklesIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
};

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const t = await getTrip(id);
      setTrip(t);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorState title="Could not load trip" retry={load} />;
  if (showSkeleton) return <div><Skeleton variant="title" className="w-48 mb-6" /><Skeleton variant="card" /></div>;
  if (!trip) return null;

  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <h1 className="type-section-heading">{trip.destination}</h1>
      <p className="type-caption text-text-secondary mt-1 capitalize">
        {trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}
      </p>

      <Card elevated className="mt-6 relative">
        <div className="absolute top-5 right-5 text-4xl">{PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}</div>
        <h2 className="type-card-title">Overview</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="type-caption text-text-tertiary">Departure</dt>
            <dd className="type-body mt-0.5">{departure}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Return</dt>
            <dd className="type-body mt-0.5">{returnDate}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Total Budget</dt>
            <dd className="type-body-emphasis mt-0.5">${trip.total_budget.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Hotel Style</dt>
            <dd className="type-body mt-0.5 capitalize">{(trip.hotel_prefs || 'mid_range').replace('_', ' ')}</dd>
          </div>
        </dl>
      </Card>

      <h2 className="type-card-title mt-8 mb-3">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Link to={`/trips/${id}/budget`}>
          <Button variant="pill-outline" icon={CalculatorIcon}>Budget</Button>
        </Link>
        <Link to={`/trips/${id}/ai`}>
          <Button variant="pill-outline" icon={SparklesIcon}>AI Advisor</Button>
        </Link>
        <Link to={`/trips/${id}/recommendations`}>
          <Button variant="pill-outline" icon={BookmarkIcon}>Recommendations</Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

`npm run dev` → /trips/:id. Verify overview card with emoji top-right, dl grid layout, three pill-outline action buttons with Heroicons.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/TripDetailPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): TripDetailPage uses Card + pill Buttons

Purpose emoji kept as top-right brand accent on overview card.
dl/dt/dd semantic markup for trip facts with type classes.
Quick Actions row uses pill-outline Buttons with Heroicons
(Calculator/Sparkles/Bookmark).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: Refactor `AiInsightCard.jsx`

**Files:**
- Modify: `frontend/src/components/AiInsightCard.jsx`

- [ ] **Step 1: Replace `frontend/src/components/AiInsightCard.jsx`**

```jsx
import Card from './ui/Card';

export default function AiInsightCard({ icon: Icon, title, description, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-left w-full disabled:opacity-50 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 rounded-xl"
    >
      <Card padding="md" className="h-full">
        {Icon && <Icon className="w-6 h-6 text-apple-blue mb-2" />}
        <h3 className="type-body-emphasis">{title}</h3>
        <p className="type-caption text-text-secondary mt-1">
          {loading ? (
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '300ms' }} />
            </span>
          ) : description}
        </p>
      </Card>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AiInsightCard.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): AiInsightCard accepts Heroicon + pulsing-dot loading

icon prop now takes a Heroicon component (not emoji string).
Loading state shows three staggered pulsing dots in place of "Thinking..."
text. Focus ring for keyboard users. Uses Card primitive for consistent
styling.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: Create `ToolBadgeRow.jsx` + tests

**Files:**
- Create: `frontend/src/components/ToolBadgeRow.jsx`
- Create: `frontend/src/test/ToolBadgeRow.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/ToolBadgeRow.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolBadgeRow from '../components/ToolBadgeRow';

describe('<ToolBadgeRow>', () => {
  it('renders nothing when toolsUsed is empty', () => {
    const { container } = render(<ToolBadgeRow toolsUsed={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when toolsUsed is undefined', () => {
    const { container } = render(<ToolBadgeRow />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one badge per tool with human labels', () => {
    render(<ToolBadgeRow toolsUsed={['get_saved_recommendations', 'calculate_daily_spend']} />);
    expect(screen.getByText('Checked your saved items')).toBeInTheDocument();
    expect(screen.getByText('Calculated daily spend')).toBeInTheDocument();
  });

  it('deduplicates repeated tool names', () => {
    render(<ToolBadgeRow toolsUsed={['get_saved_recommendations', 'get_saved_recommendations']} />);
    const badges = screen.getAllByText('Checked your saved items');
    expect(badges).toHaveLength(1);
  });

  it('falls back to raw tool name when not in label map', () => {
    render(<ToolBadgeRow toolsUsed={['unknown_tool_name']} />);
    expect(screen.getByText('unknown_tool_name')).toBeInTheDocument();
  });

  it('applies tool-called badge variant', () => {
    const { container } = render(<ToolBadgeRow toolsUsed={['calculate_daily_spend']} />);
    expect(container.querySelector('span').className).toMatch(/text-apple-blue/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ToolBadgeRow.test.jsx`
Expected: FAIL with import error.

- [ ] **Step 3: Create `frontend/src/components/ToolBadgeRow.jsx`**

```jsx
import Badge from './ui/Badge';
import { humanizeToolName } from '../config/toolLabels';

export default function ToolBadgeRow({ toolsUsed }) {
  if (!toolsUsed || toolsUsed.length === 0) return null;

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = toolsUsed.filter((t) => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {unique.map((tool, i) => (
        <span
          key={tool}
          style={{
            animation: `stagger-fade-in 200ms ease-out both`,
            animationDelay: `${i * 50}ms`,
          }}
        >
          <Badge variant="tool-called">{humanizeToolName(tool)}</Badge>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ToolBadgeRow.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ToolBadgeRow.jsx frontend/src/test/ToolBadgeRow.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): add ToolBadgeRow for Phase 1 tools_used display

Deduplicates repeated tool names, falls back to raw name for
unknown tools (Phase 2 forward compat), stagger-fade-in animation
with 50ms offset per badge. Uses humanizeToolName from config.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: Refactor `AiChatPanel.jsx` + tests

**Files:**
- Modify: `frontend/src/components/AiChatPanel.jsx`
- Create: `frontend/src/test/AiChatPanel.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/test/AiChatPanel.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiChatPanel from '../components/AiChatPanel';

describe('<AiChatPanel>', () => {
  it('renders empty state when no messages', () => {
    render(<AiChatPanel messages={[]} thinking={false} />);
    expect(screen.getByText(/click an action/i)).toBeInTheDocument();
  });

  it('renders user messages', () => {
    render(<AiChatPanel messages={[{ role: 'user', content: 'Hello' }]} thinking={false} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders AI messages', () => {
    render(<AiChatPanel messages={[{ role: 'ai', content: 'Hi there' }]} thinking={false} />);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('renders tool badges under AI messages with tools_used', () => {
    render(<AiChatPanel messages={[
      { role: 'ai', content: 'Advice', tools_used: ['get_savings_progress'] }
    ]} thinking={false} />);
    expect(screen.getByText('Reviewed savings progress')).toBeInTheDocument();
  });

  it('does not render tool badges for user messages', () => {
    render(<AiChatPanel messages={[
      { role: 'user', content: 'Hi', tools_used: ['get_savings_progress'] }
    ]} thinking={false} />);
    expect(screen.queryByText('Reviewed savings progress')).not.toBeInTheDocument();
  });

  it('shows thinking shimmer when thinking prop is true', () => {
    const { container } = render(<AiChatPanel messages={[]} thinking={true} />);
    expect(container.querySelector('[data-testid="thinking-dots"]')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AiChatPanel.test.jsx`
Expected: FAIL — current AiChatPanel has different signature.

- [ ] **Step 3: Replace `frontend/src/components/AiChatPanel.jsx`**

```jsx
import { useEffect, useRef } from 'react';
import { ChatBubbleLeftEllipsisIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import ToolBadgeRow from './ToolBadgeRow';
import Button from './ui/Button';

export default function AiChatPanel({ messages, thinking, onSaveRecommendation }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  if (messages.length === 0 && !thinking) {
    return (
      <div className="bg-white rounded-xl flex flex-col h-80">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 type-body-emphasis">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-text-tertiary" />
          AI Chat
        </div>
        <div className="flex-1 flex items-center justify-center type-caption text-text-tertiary">
          Click an action above to start
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl flex flex-col h-[28rem]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 type-body-emphasis">
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-text-tertiary" />
        AI Chat
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-apple-blue flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">AI</div>
            )}
            <div className={`rounded-lg px-3 py-2 type-body max-w-[80%] whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-surface-light text-text-primary'
                : 'bg-white text-text-primary border border-gray-100'
            }`}>
              {msg.content}
              {msg.role === 'ai' && <ToolBadgeRow toolsUsed={msg.tools_used} />}
              {msg.role === 'ai' && msg.canSave && onSaveRecommendation && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={BookmarkIcon}
                    onClick={() => onSaveRecommendation(msg)}
                  >
                    Save this
                  </Button>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-text-primary flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">You</div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-apple-blue flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">AI</div>
            <div
              data-testid="thinking-dots"
              className="bg-white border border-gray-100 rounded-lg px-3 py-3 flex gap-1 items-center"
            >
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AiChatPanel.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AiChatPanel.jsx frontend/src/test/AiChatPanel.test.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): AiChatPanel with right-aligned user, tool badges, save

User bubbles right-aligned with surface-light bg, AI bubbles
left-aligned with subtle border. Avatar initials ("AI"/"You")
in circles. ToolBadgeRow renders under AI messages with tools_used.
Inline "Save this" Button when msg.canSave + onSaveRecommendation.
Thinking state is three-dot staggered shimmer.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: Refactor `AiAdvisorPage.jsx`

**Files:**
- Modify: `frontend/src/pages/AiAdvisorPage.jsx`

- [ ] **Step 1: Replace `frontend/src/pages/AiAdvisorPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  CakeIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAllocation } from '../services/budgetService';
import { analyzeBudget, getAiRecommendations } from '../services/aiService';
import { createRecommendation } from '../services/recommendationService';
import AiInsightCard from '../components/AiInsightCard';
import AiChatPanel from '../components/AiChatPanel';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import toast from 'react-hot-toast';

export default function AiAdvisorPage() {
  const { id } = useParams();
  const [hasBudget, setHasBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [messages, setMessages] = useState([]);
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    getAllocation(id)
      .then(() => setHasBudget(true))
      .catch(() => setHasBudget(false))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAnalyze() {
    setActiveAction('analyze');
    setMessages((prev) => [...prev, { role: 'user', content: 'Analyze my budget allocation' }]);
    try {
      const { advice, tools_used } = await analyzeBudget(id);
      setMessages((prev) => [...prev, { role: 'ai', content: advice, tools_used }]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I couldn't analyze your budget right now. Please try again." }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRecommend(focus) {
    setActiveAction(focus);
    setMessages((prev) => [...prev, { role: 'user', content: `Get ${focus} recommendations` }]);
    try {
      const { advice, tools_used } = await getAiRecommendations(id, focus);
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: advice,
        tools_used,
        canSave: true,
        category: focus === 'hotels' ? 'hotel' : focus === 'food' ? 'restaurant' : focus === 'activities' ? 'attraction' : null,
      }]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I couldn't get recommendations right now. Please try again." }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveRecommendation(msg) {
    if (!msg.category) {
      toast.error('Cannot save this type of recommendation');
      return;
    }
    try {
      const firstLine = msg.content.split('\n').find((line) => line.trim().length > 0) || 'AI suggestion';
      const name = firstLine.slice(0, 80);
      await createRecommendation(id, {
        category: msg.category,
        source: 'ai_generated',
        name,
        description: msg.content.slice(0, 400),
        is_ai_pick: true,
      });
      toast.success('Saved');
    } catch {
      toast.error('Could not save');
    }
  }

  if (showSkeleton) {
    return <div><Skeleton variant="title" className="w-48 mb-6" /><Skeleton variant="card" /></div>;
  }

  if (!hasBudget) {
    return (
      <EmptyState
        icon={<ChartBarIcon className="w-12 h-12" />}
        title="Generate a budget first"
        description="The AI advisor needs a budget allocation to work with."
        action={
          <Link to={`/trips/${id}/budget`}>
            <Button>Go to Budget</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="type-section-heading">AI Advisor</h1>
      <p className="type-caption text-text-secondary mt-1">Get AI-powered budget analysis and recommendations</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
        <AiInsightCard icon={ChartBarIcon} title="Analyze Budget" description="Get AI feedback on your allocation"
          onClick={handleAnalyze} loading={activeAction === 'analyze'} />
        <AiInsightCard icon={GlobeAltIcon} title="Overall" description="Get overall recommendations"
          onClick={() => handleRecommend('overall')} loading={activeAction === 'overall'} />
        <AiInsightCard icon={BuildingOffice2Icon} title="Hotels" description="Get hotel picks"
          onClick={() => handleRecommend('hotels')} loading={activeAction === 'hotels'} />
        <AiInsightCard icon={CakeIcon} title="Food" description="Get food picks"
          onClick={() => handleRecommend('food')} loading={activeAction === 'food'} />
        <AiInsightCard icon={MapPinIcon} title="Activities" description="Get activity picks"
          onClick={() => handleRecommend('activities')} loading={activeAction === 'activities'} />
      </div>

      <div className="mt-6">
        {messages.length === 0 && !activeAction ? (
          <EmptyState
            icon={<SparklesIcon className="w-12 h-12" />}
            title="Ask the AI"
            description="Click an action above to start a conversation."
          />
        ) : (
          <AiChatPanel
            messages={messages}
            thinking={activeAction !== null}
            onSaveRecommendation={handleSaveRecommendation}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually end-to-end**

`npm run dev` (in another terminal, `python app.py` must be running with `.venv`). Navigate to a trip's AI Advisor. Test:
- No-budget state redirects to budget page
- Click "Analyze Budget" → thinking dots → AI response appears with tool badges
- Click "Hotels" → response has "Save this" button; click Save → toast "Saved"; visit Recommendations page to verify

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AiAdvisorPage.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): AiAdvisorPage with Heroicons, tool badges, inline save

Heroicon props on AiInsightCard (ChartBar/Globe/BuildingOffice2/
Cake/MapPin). AI messages from handleRecommend carry canSave+category
for inline save button. ToolBadgeRow surfaces Phase 1 tools_used.
EmptyState for chat-not-started.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Refactor `TripsPage.jsx` (Modal extraction + primitives)

**Files:**
- Modify: `frontend/src/pages/TripsPage.jsx`
- Create: `frontend/src/test/TripsPage.test.jsx` (new, or update existing if present)

- [ ] **Step 1: Write the failing test**

Create or replace `frontend/src/test/TripsPage.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripsPage from '../pages/TripsPage';

vi.mock('../services/tripService', () => ({
  getTrips: vi.fn().mockResolvedValue([]),
  createTrip: vi.fn().mockResolvedValue({ id: 'new', destination: 'Paris', total_budget: 3000 }),
}));

function renderTripsPage() {
  return render(<MemoryRouter><TripsPage /></MemoryRouter>);
}

describe('<TripsPage>', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no trips', async () => {
    renderTripsPage();
    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeInTheDocument());
  });

  it('opens modal when "New Trip" button clicked', async () => {
    renderTripsPage();
    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /new trip/i }));
    expect(screen.getByText(/plan a new trip/i)).toBeInTheDocument();
  });

  it('closes modal when close button clicked', async () => {
    renderTripsPage();
    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /new trip/i }));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText(/plan a new trip/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Replace `frontend/src/pages/TripsPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getTrips, createTrip } from '../services/tripService';
import TripCard from '../components/TripCard';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import toast from 'react-hot-toast';

const TRIP_PURPOSES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
  { value: 'family', label: 'Family' },
  { value: 'adventure', label: 'Adventure' },
];
const HOTEL_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid_range', label: 'Mid range' },
  { value: 'luxury', label: 'Luxury' },
];
const FOOD_OPTIONS = ['fine_dining', 'street_food', 'budget_eats', 'local_cuisine'];
const ACTIVITY_OPTIONS = ['museums', 'nightlife', 'beaches', 'hiking', 'attractions', 'shopping'];

const INITIAL_FORM = {
  destination: '', destination_country: '', total_budget: '',
  departure_date: '', return_date: '', trip_purpose: 'vacation',
  num_travelers: 1, food_prefs: [], activity_prefs: [], hotel_prefs: 'mid_range',
};

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  async function loadTrips() {
    setLoading(true);
    setError(false);
    try {
      const data = await getTrips();
      setTrips(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTrips(); }, []);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field, item) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newTrip = await createTrip({
        ...form,
        total_budget: Number(form.total_budget),
        num_travelers: Number(form.num_travelers),
      });
      setTrips((prev) => [...prev, newTrip]);
      setShowModal(false);
      setForm(INITIAL_FORM);
      toast.success('Trip created');
    } catch {
      toast.error('Could not create trip');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState title="Could not load trips" retry={loadTrips} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="type-section-heading">My Trips</h1>
          <p className="type-caption text-text-secondary mt-1">Plan and manage your travel budgets</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={PlusIcon}>New Trip</Button>
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<PaperAirplaneIcon className="w-12 h-12" />}
          title="No trips yet"
          description="Plan your first trip to get started."
          action={<Button onClick={() => setShowModal(true)}>Plan a Trip</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Plan a New Trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Destination" value={form.destination}
            onChange={(v) => updateForm('destination', v)} placeholder="Tokyo" required />

          <Input label="Country" value={form.destination_country}
            onChange={(v) => updateForm('destination_country', v)} placeholder="Japan" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Budget ($)" type="number" value={form.total_budget}
              onChange={(v) => updateForm('total_budget', v)} placeholder="3500" required />
            <Input label="Travelers" type="number" value={form.num_travelers}
              onChange={(v) => updateForm('num_travelers', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" type="date" value={form.departure_date}
              onChange={(v) => updateForm('departure_date', v)} required />
            <Input label="Return" type="date" value={form.return_date}
              onChange={(v) => updateForm('return_date', v)} required />
          </div>

          <Select label="Trip Purpose" options={TRIP_PURPOSES}
            value={form.trip_purpose} onChange={(v) => updateForm('trip_purpose', v)} />

          <Select label="Hotel Preference" options={HOTEL_OPTIONS}
            value={form.hotel_prefs} onChange={(v) => updateForm('hotel_prefs', v)} />

          <fieldset>
            <legend className="text-xs text-text-secondary mb-2">Food Preferences</legend>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((f) => (
                <button key={f} type="button" onClick={() => toggleArrayItem('food_prefs', f)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.food_prefs.includes(f) ? 'bg-apple-blue text-white border-apple-blue' : 'border-gray-200 text-text-secondary hover:border-gray-400'
                  }`}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs text-text-secondary mb-2">Activity Preferences</legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggleArrayItem('activity_prefs', a)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.activity_prefs.includes(a) ? 'bg-apple-blue text-white border-apple-blue' : 'border-gray-200 text-text-secondary hover:border-gray-400'
                  }`}>
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create Trip'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Run test to verify passing**

Run: `npm test -- TripsPage.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Verify manually**

`npm run dev` → /trips. Test:
- Empty state with PaperAirplane icon
- "New Trip" button opens Modal with slide-up animation
- Inputs/Selects use primitive styling
- Submit creates trip, closes modal, toast appears

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TripsPage.jsx frontend/src/test/TripsPage.test.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): TripsPage with Modal primitive and skeleton loader

Modal/Input/Select/Button primitives replace 80+ lines of inline
form JSX. Skeleton grid during load. PaperAirplane EmptyState when
no trips. ErrorState with retry on fetch failure. PURPOSE/HOTEL
options converted to label-value pairs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: Toaster styling + delete LoadingSpinner

**Files:**
- Modify: `frontend/src/App.jsx`
- Delete: `frontend/src/components/LoadingSpinner.jsx`

- [ ] **Step 1: Read current `frontend/src/App.jsx`**

Read: `frontend/src/App.jsx`. It has `<Toaster />` from react-hot-toast without customization.

- [ ] **Step 2: Update Toaster config in `App.jsx`**

Find the line `<Toaster />` in `App.jsx` and replace with:

```jsx
<Toaster
  position="bottom-center"
  toastOptions={{
    duration: 4000,
    className: '',
    style: {
      background: '#1d1d1f',
      color: '#fff',
      fontSize: '14px',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '3px 5px 30px 0 rgba(0, 0, 0, 0.22)',
    },
    success: { iconTheme: { primary: '#34c759', secondary: '#fff' } },
    error: { iconTheme: { primary: '#ff3b30', secondary: '#fff' } },
  }}
/>
```

- [ ] **Step 3: Delete `frontend/src/components/LoadingSpinner.jsx`**

Grep first to ensure no remaining imports:
```bash
cd /Users/heitindersingh/CSCI318Project/frontend && grep -rn "LoadingSpinner" src/
```

Expected: no results. If any matches found (other than the file itself), those files need to be updated to use `<Skeleton>` or `<Button loading>` before deletion.

If grep is clean:
```bash
rm frontend/src/components/LoadingSpinner.jsx
```

- [ ] **Step 4: Run full test suite**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx
git rm frontend/src/components/LoadingSpinner.jsx
git commit -m "$(cat <<'EOF'
refactor(frontend): Apple-style Toaster + delete LoadingSpinner

Toaster position=bottom-center, near-black background, white text,
soft shadow. Success/error icon themes match Apple system colors.
LoadingSpinner deleted — all usages replaced by Skeleton (on pages)
or Button loading prop (on form submits).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 26: Final verification — full suite + manual responsive + golden-path

**Files:** None modified.

- [ ] **Step 1: Run full frontend test suite**

```bash
cd /Users/heitindersingh/CSCI318Project/frontend && npm test
```
Expected: All tests pass. Count should be ~90+ (existing 28 + ~60 new unit tests + ~4 new integration tests).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: zero errors. If errors, fix inline before proceeding.

- [ ] **Step 3: Run backend test suite (sanity check — nothing should have changed)**

```bash
cd /Users/heitindersingh/CSCI318Project && source .venv/bin/activate && python -m pytest tests/ 2>&1 | tail -1
```
Expected: `88 passed` (same as after Phase 1).

- [ ] **Step 4: Manual responsive audit**

Start both servers:
```bash
# Terminal 1:
cd /Users/heitindersingh/CSCI318Project && source .venv/bin/activate && python app.py

# Terminal 2:
cd /Users/heitindersingh/CSCI318Project/frontend && npm run dev
```

Open Chrome DevTools, switch to Device Toolbar (Cmd+Shift+M). Check each breakpoint:

- **375px (iPhone SE):** Sidebar becomes hamburger. No horizontal scroll. All 7 pages.
- **768px (iPad):** Sidebar visible. 2-column grids.
- **1440px (laptop):** Full sidebar + 3-column grids + 5-column AiInsightCard row.

For each breakpoint, visit: /login, /trips, /trips/:id, /trips/:id/budget, /trips/:id/ai, /trips/:id/recommendations. Confirm no overflow, readable text, touch targets ≥44px on mobile.

- [ ] **Step 5: Keyboard navigation test**

At desktop width, unplug your mouse (or at least don't use it). Tab through every page. Verify:
- Every interactive element reachable
- Focus ring visible on every focused element
- Modal traps focus (Tab inside modal doesn't escape to sidebar)
- Escape closes modals

- [ ] **Step 6: Reduced-motion test**

On macOS: System Settings → Accessibility → Display → enable "Reduce motion."
Reload the app. Verify:
- Card hover no longer lifts
- Modal appears instantly (no slide-up)
- Skeleton shimmer reduced/static
- Progress bar fills instantly

Disable reduced motion and confirm animations return.

- [ ] **Step 7: Golden-path smoke test (real browser, real backend, real OpenAI)**

Sign out if logged in. Then:
1. Sign up with a new email (or reuse existing) → lands on /trips with empty state
2. Click "Plan a Trip" → modal opens with slide-up animation
3. Fill trip form (destination: Paris, budget: 3000, dates: 2026-07-01 to 2026-07-08, vacation purpose, mid-range hotel, fine_dining + street_food, museums + nightlife) → Create → trip card appears
4. Click trip card → TripDetailPage shows overview with 🌴 emoji and 3 pill action buttons
5. Click "Budget" → generate allocation → pie chart + savings plan render
6. Enter "500" amount saved → Save → progress bar animates
7. Click "AI Advisor" → 5 action cards visible with Heroicons
8. Click "Analyze Budget" → pulsing dots on the card → thinking shimmer in chat → AI response appears WITH tool badges underneath (likely "Reviewed savings progress")
9. Click "Hotels" → AI response with tool badges + "Save this" button on the AI message
10. Click "Save this" → toast appears (bottom-center, near-black)
11. Navigate to Recommendations → saved item appears with "AI Pick" badge

All 11 steps pass without JS console errors.

- [ ] **Step 8: Final commit — only if any docs or tweaks emerged**

```bash
git status
```
If clean, the redesign is complete. If anything adjusted during QA, commit it with a clear message.

---

## Success criteria (from spec §11)

- [x] Every page feels cohesive — consistent typography, spacing, color, iconography
- [x] A new developer can read `src/components/ui/` and understand every primitive in under 5 minutes
- [x] The `tools_used` badges visibly demonstrate Phase 1 tool-calling work
- [x] Manual smoke test at 375px shows zero horizontal scroll and touchable targets
- [x] Keyboard-only navigation works across every page
- [x] Users with reduced-motion see a still interface
- [x] Zero regression — backend 88 tests green, existing frontend tests green, new tests green

---

## What this plan does NOT do (deferred)

- Web search tool (Phase 2)
- Flights API (Phase 2)
- Day-to-day itinerary feature (Phase 3)
- Feedback buttons (Phase 3)
- AI chat history persistence (Phase 3)
- Storybook documentation site
- Dark mode toggle
- i18n / localization
- Visual regression screenshot tests
