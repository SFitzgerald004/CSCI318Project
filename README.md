# TripBudget — AI-Powered Travel Budget Planner

An AI-powered budgeting system for vacation planning. Users input trip details — destination, dates, budget, preferences — and the app generates smart budget allocations, savings plans, and AI-powered recommendations for hotels, food, and activities.

Built with a **Flask** REST API backend and a **React** single-page application frontend.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Flask, Flask-CORS |
| Database | Cloud Firestore |
| Authentication | Firebase Auth (Email/Password) |
| AI | OpenAI GPT-4o-mini |
| Testing | Pytest (backend), Vitest (frontend) |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Firebase project with:
  - **Email/Password Authentication** enabled
  - **Cloud Firestore** database created
  - A **web app** registered (for frontend config)
  - A **service account key** downloaded (for backend)
- An OpenAI API key

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/SFitzgerald004/CSCI318Project.git
cd CSCI318Project
```

### 2. Backend setup

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
FIREBASE_CREDENTIALS=firebase.json
OPENAI_API_KEY=your-openai-api-key
```

Place your Firebase service account JSON file in the project root as `firebase.json`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `frontend/.env` file with your Firebase web app config:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

You can find these values in **Firebase Console > Project Settings > Your apps > Web app**.

---

## Running the App

Open two terminals:

**Terminal 1 — Backend (Flask):**

```bash
cd CSCI318Project
source .venv/bin/activate
python app.py
```

Runs at `http://localhost:5001`

**Terminal 2 — Frontend (Vite):**

```bash
cd CSCI318Project/frontend
npm run dev
```

Runs at `http://localhost:5173`

Open **http://localhost:5173** in your browser. The Vite dev server proxies API calls to the Flask backend automatically.

---

## Running Tests

**Backend tests (40 tests):**

```bash
cd CSCI318Project
source .venv/bin/activate
python -m pytest tests/ -v
```

**Frontend tests (28 tests):**

```bash
cd frontend
npm test
```

---

## Features

### Trip Management
- Create trips with destination, dates, budget, and preferences
- View all your trips in a card grid
- Trip detail page with overview and quick actions

### Smart Budget Allocation
- Rule-based budget engine splits your total budget across 6 categories: flights, hotel, food, activities, transport, misc
- Adjusts allocations based on trip purpose, destination cost of living, duration, and your preferences
- Interactive pie chart visualization (Recharts)

### Savings Plan
- Calculates weekly, bi-weekly, and monthly savings targets
- Progress bar tracking how much you've saved toward your trip goal

### AI Advisor
- **Budget Analysis** — AI reviews your allocation and gives 3-5 bullet points of advice
- **Category Recommendations** — AI suggests specific hotels, restaurants, or activities within your budget
- Chat-style UI that logs all AI interactions for easy reference

### Saved Recommendations
- Save AI-generated or manually added recommendations
- Filter by category (Hotels, Restaurants, Attractions)
- Each recommendation shows name, rating, price level, source, and description

---

## Authentication

All API endpoints require a Firebase Auth token:

```
Authorization: Bearer <Firebase ID token>
```

The React frontend handles this automatically — Firebase Auth signs the user in, and an Axios interceptor attaches the token to every API request.

---

## API Endpoints

### Trips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | Get all trips for the logged-in user |
| POST | `/api/trips` | Create a new trip |
| GET | `/api/trips/<trip_id>` | Get a specific trip |

**POST /api/trips — Request body:**

```json
{
    "destination": "Paris, France",
    "destination_country": "France",
    "total_budget": 3000,
    "departure_date": "2026-07-01",
    "return_date": "2026-07-08",
    "trip_purpose": "vacation",
    "num_travelers": 2,
    "food_prefs": ["fine_dining", "street_food"],
    "activity_prefs": ["museums", "nightlife"],
    "hotel_prefs": "mid_range"
}
```

Valid values:
- `trip_purpose`: `vacation`, `business`, `family`, `adventure`
- `hotel_prefs`: `budget`, `mid_range`, `luxury`
- `food_prefs`: `fine_dining`, `street_food`, `budget_eats`, `local_cuisine`
- `activity_prefs`: `museums`, `attractions`, `nightlife`, `beaches`, `hiking`, `shopping`

### Budget

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budget/<trip_id>/allocate` | Generate a budget allocation |
| GET | `/api/budget/<trip_id>/allocate` | Get the saved allocation |
| POST | `/api/budget/<trip_id>/savings` | Generate/update a savings plan |
| GET | `/api/budget/<trip_id>/savings` | Get the saved savings plan |

**POST /api/budget/<trip_id>/savings — Request body:**

```json
{
    "amount_saved": 500
}
```

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/<trip_id>/analyze` | AI feedback on budget allocation |
| POST | `/api/ai/<trip_id>/recommend` | AI recommendations for a category |

**POST /api/ai/<trip_id>/recommend — Request body:**

```json
{
    "focus": "hotels"
}
```

Valid values for `focus`: `hotels`, `food`, `activities`, `overall`

A budget allocation must exist before calling AI endpoints.

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations/<trip_id>` | Get all recommendations |
| GET | `/api/recommendations/<trip_id>?category=hotel` | Filter by category |
| POST | `/api/recommendations/<trip_id>` | Save a recommendation |
| DELETE | `/api/recommendations/<trip_id>/<rec_id>` | Delete a recommendation |

Valid categories: `hotel`, `restaurant`, `attraction`, `flight`, `car_rental`

---

## Project Structure

```
CSCI318Project/
├── app.py                          # Flask app factory
├── config.py                       # Environment config
├── extensions.py                   # Firebase initialization
├── requirements.txt
├── models/                         # Firestore data models
│   ├── trip.py
│   ├── budget.py
│   ├── savings_plan.py
│   └── recommendation.py
├── routes/                         # API route handlers
│   ├── auth.py                     # Token verification decorator
│   ├── trips.py
│   ├── budget.py
│   ├── ai.py
│   └── recommendations.py
├── services/                       # Business logic
│   ├── budget_engine.py            # Rule-based budget allocation
│   └── ai_service.py              # OpenAI integration
├── tests/                          # Backend tests (pytest)
│   ├── test_budget_engine.py
│   ├── test_routes.py
│   └── test_models.py
└── frontend/                       # React SPA
    ├── src/
    │   ├── components/             # Reusable UI components
    │   │   ├── Sidebar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── TripCard.jsx
    │   │   ├── BudgetChart.jsx
    │   │   ├── SavingsProgress.jsx
    │   │   ├── AiChatPanel.jsx
    │   │   ├── AiInsightCard.jsx
    │   │   └── RecommendationCard.jsx
    │   ├── pages/                  # Route pages
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── TripsPage.jsx
    │   │   ├── TripDetailPage.jsx
    │   │   ├── BudgetPage.jsx
    │   │   ├── AiAdvisorPage.jsx
    │   │   └── RecommendationsPage.jsx
    │   ├── services/               # API client layer
    │   │   ├── api.js              # Axios + auth interceptor
    │   │   ├── tripService.js
    │   │   ├── budgetService.js
    │   │   ├── aiService.js
    │   │   └── recommendationService.js
    │   ├── context/
    │   │   └── AuthContext.jsx     # Firebase auth state
    │   ├── config/
    │   │   └── firebase.js         # Firebase SDK init
    │   └── test/                   # Frontend tests (vitest)
    ├── package.json
    └── vite.config.js              # Dev server + API proxy
```
