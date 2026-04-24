# React Frontend Design — TripBudget

## Overview

A React single-page application for the TripBudget Flask API. Users sign in with Firebase Auth, create trips, view AI-generated budget allocations, track savings plans, get AI travel advice, and manage recommendations. Built as a portfolio piece — clean UX, solid architecture, polished enough to impress.

## Tech Stack

- **Vite + React** — client-side SPA
- **Tailwind CSS** — utility-first styling
- **React Router** — client-side routing
- **Axios** — HTTP client with auth interceptor
- **Firebase JS SDK** — client-side authentication (email/password)
- **Recharts** — budget pie chart visualization
- **React Hot Toast** — toast notifications for errors/success

## Project Structure

Monorepo — React app lives inside the existing Flask project:

```
CSCI318Project/
├── app.py, routes/, models/, services/    # existing Flask backend
└── frontend/                               # new React app
    ├── src/
    │   ├── components/                     # reusable UI
    │   │   ├── Sidebar.jsx
    │   │   ├── TripCard.jsx
    │   │   ├── BudgetChart.jsx
    │   │   ├── SavingsProgress.jsx
    │   │   ├── RecommendationCard.jsx
    │   │   ├── AiChatPanel.jsx
    │   │   ├── AiInsightCard.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/                          # one per route
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── TripsPage.jsx
    │   │   ├── TripDetailPage.jsx
    │   │   ├── BudgetPage.jsx
    │   │   ├── AiAdvisorPage.jsx
    │   │   └── RecommendationsPage.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx             # Firebase auth state
    │   ├── services/                       # API call layer
    │   │   ├── api.js                      # axios instance + auth header
    │   │   ├── tripService.js
    │   │   ├── budgetService.js
    │   │   ├── aiService.js
    │   │   └── recommendationService.js
    │   ├── config/
    │   │   └── firebase.js                 # Firebase SDK init
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js                      # proxy /api to Flask :5000
```

## Routing

| Route | Page Component | Auth | Description |
|-------|---------------|------|-------------|
| `/login` | LoginPage | Public | Email/password sign in |
| `/signup` | SignupPage | Public | Create account |
| `/trips` | TripsPage | Protected | Trip list + create new |
| `/trips/:id` | TripDetailPage | Protected | Trip overview — destination, dates, prefs |
| `/trips/:id/budget` | BudgetPage | Protected | Budget allocation + pie chart + savings plan |
| `/trips/:id/ai` | AiAdvisorPage | Protected | AI insight cards + chat panel |
| `/trips/:id/recommendations` | RecommendationsPage | Protected | Saved recommendations by category |

Default redirect: unauthenticated users → `/login`, authenticated users → `/trips`.

## Layout

**Sidebar dashboard layout** for all protected routes.

### Sidebar behavior:
- **On `/trips`**: Shows app name, "My Trips" nav item (active), user email, sign out
- **Inside a trip (`/trips/:id/*`)**: Shows "← All Trips" back link, trip name as a label, then sub-navigation: Overview, Budget, AI Advisor, Recommendations. Active item highlighted with blue background.

### Content area:
- Light gray background (`#f5f5f7`)
- Page title + subtitle at top
- Content in white cards with subtle shadows

## Authentication

### Flow:
1. User enters email/password on LoginPage
2. Firebase JS SDK calls `signInWithEmailAndPassword()`
3. Firebase returns user object + ID token
4. `AuthContext` stores user and provides `getToken()` helper
5. `api.js` axios instance uses an interceptor to attach `Authorization: Bearer <token>` to every request
6. Flask's `require_auth` decorator validates the token server-side

### AuthContext provides:
- `user` — Firebase user object (or null)
- `loading` — true while checking initial auth state
- `login(email, password)` — sign in
- `signup(email, password)` — create account
- `logout()` — sign out

### ProtectedRoute:
- Wraps protected routes
- If `loading`, shows spinner
- If no `user`, redirects to `/login`
- Otherwise renders children with sidebar layout

## Pages

### LoginPage / SignupPage
- Centered card on dark background
- Email + password fields
- Submit button (blue)
- Link to switch between login/signup
- Error messages displayed inline (e.g., "Invalid credentials")

### TripsPage
- Grid of trip cards (3 columns on desktop, responsive)
- Each card shows: destination emoji, destination name, trip purpose, dates, budget, "View →" link
- "New Trip" button opens a modal/form with fields: destination, country, total budget, departure date, return date, trip purpose, number of travelers, food prefs (multi-select), activity prefs (multi-select), hotel prefs (select)
- Empty state when no trips: illustration + "Plan your first trip" CTA

### TripDetailPage (Overview)
- Trip summary: destination, dates, purpose, travelers, preferences
- Quick action cards: "Generate Budget", "Get AI Advice", "View Recommendations"
- Status indicators for what's been generated (budget exists? savings plan exists?)

### BudgetPage
- Two-column layout:
  - Left: Pie chart (Recharts) showing allocation percentages by category
  - Right: Amounts list — each category with icon, name, dollar amount
- Below: Savings plan section
  - Three stat cards: monthly, bi-weekly, weekly savings needed
  - Progress bar showing amount saved vs. total budget
  - Input to update amount saved
- "Generate Budget" button if no allocation exists yet
- "Regenerate" button to re-run allocation

### AiAdvisorPage

**Prerequisite check:** On mount, check if a budget allocation exists for the trip (`GET /api/budget/:id/allocate`). If not, show a "Generate a budget first" prompt linking to the Budget page. Both AI endpoints return 400 without an allocation.

- **Top section — Inline insight cards:**
  - "Analyze My Budget" card — triggers `POST /api/ai/:id/analyze`, shows response as a formatted card
  - Focus category cards (Hotels, Food, Activities, Overall) — trigger `POST /api/ai/:id/recommend` with focus param, shows numbered recommendations
- **Bottom section — Chat panel (local UI history, not a backend chat API):**
  - Scrollable message area with AI responses styled as chat bubbles
  - Each "Analyze" or "Recommend" action appends its response to the chat history for context (stored in component state only — not persisted)
  - Loading state with typing indicator while waiting for AI response
  - The chat is a log of one-shot API calls, not a conversational endpoint

### RecommendationsPage
- Category tabs: All, Hotels, Restaurants, Attractions
- Grid of recommendation cards, each showing: name, category badge, source badge (yelp/amadeus/ai), rating, price level, description, address
- "AI Pick" badge on AI-generated recommendations
- Delete button (trash icon) on each card
- Empty state per category: "No recommendations yet — try the AI Advisor"

## Data Flow

```
Firebase Auth (client-side)
    ↓ ID token
AuthContext (React context)
    ↓ provides token
api.js (axios instance)
    ↓ Bearer token in headers
Vite dev proxy (/api/* → localhost:5000)
    ↓
Flask API (require_auth validates token)
    ↓
Firestore (data store)
```

## API Service Layer

### api.js
- Creates axios instance with `baseURL: '/api'`
- Request interceptor: gets fresh token from Firebase user, attaches as Bearer header
- Response interceptor: on 401, triggers logout + redirect to `/login`

### Service files
Each service file exports functions that call the API:

**tripService.js**: `getTrips()`, `getTrip(tripId)`, `createTrip(data)`

> **Backend note:** The Flask backend has a `Trip.get(trip_id)` static method but no dedicated `GET /api/trips/<trip_id>` route. We need to add this route to the backend before the frontend can fetch individual trips. Alternatively, the frontend can fetch all trips via `getTrips()` and filter client-side — but a dedicated route is cleaner and avoids over-fetching.
**budgetService.js**: `getAllocation(tripId)`, `createAllocation(tripId)`, `getSavings(tripId)`, `createSavings(tripId, amountSaved)`
**aiService.js**: `analyzeBudget(tripId)`, `getRecommendations(tripId, focus)`
**recommendationService.js**: `getRecommendations(tripId, category?)`, `createRecommendation(tripId, data)`, `deleteRecommendation(tripId, recId)` — delete URL: `DELETE /recommendations/${tripId}/${recId}`

## State Management

- **AuthContext** — global user session state
- **useState/useEffect** — page-level data fetching in each page component
- No Redux or other state library — the app is trip-scoped, each page fetches its own data on mount

## Dev Server Setup

### Vite config (`vite.config.js`):
```js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

### Development workflow:
1. Terminal 1: `cd CSCI318Project && python app.py` (Flask on :5000)
2. Terminal 2: `cd CSCI318Project/frontend && npm run dev` (Vite on :5173)
3. Open `http://localhost:5173` — Vite serves React, proxies API calls to Flask

## Error Handling

- API errors → toast notification (react-hot-toast) with error message
- 401 responses → auto-logout + redirect to login
- Loading states → spinner component on initial data fetch
- AI service errors (503) → "AI service temporarily unavailable" message with retry button
- Form validation → inline error messages below fields

## Known Gaps (Out of Scope)

- **No trip edit or delete** — the backend does not have PUT/DELETE endpoints for trips. Users cannot fix typos or remove test trips. Can be added later.
- **Savings plan is an upsert** — `POST /api/budget/:id/savings` overwrites the existing plan each time. The UI "update amount saved" input triggers a POST, not a PATCH. This is by design — the backend uses the trip_id as the document ID.

## Libraries

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `firebase` | Auth SDK |
| `recharts` | Pie chart for budget visualization |
| `react-hot-toast` | Toast notifications |
| `tailwindcss` + `@tailwindcss/forms` | Styling |
| `@heroicons/react` | Icon set |
