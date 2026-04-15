# CSCI318Project
Our project (name pending) is an AI-powered budgeting system for vacation planning. Users can input information regarding the trip they wish to take and the money they have for it. The AI will use that to recommend hotels, transport options, and other aspects of the trip to maximize their enjoyment and optimize their budget, making the planning phase of traveling much easier.

---

## Backend Setup

### Requirements
- Python 3.11+
- A Firebase project with Firestore and Email/Password Authentication enabled
- An OpenAI API key

### Installation
```bash
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file in the project root:
```
OPENAI_API_KEY=your-openai-key-here
FIREBASE_CREDENTIALS=firebase_credentials.json
```

Place your Firebase service account JSON file in the project root as `firebase_credentials.json`.

### Running the server
```bash
python app.py
```
Server runs at `http://127.0.0.1:5000`.

---

## Authentication

All API endpoints require a Firebase Auth token in the request header:
```
Authorization: Bearer <Firebase ID token>
```

The frontend obtains this token via Firebase Auth after the user logs in. The backend verifies it on every request.

---

## API Endpoints

### Trips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | Get all trips for the logged-in user |
| POST | `/api/trips` | Create a new trip |
| GET | `/api/trips/<trip_id>` | Get a specific trip |
| PUT | `/api/trips/<trip_id>` | Update a trip |
| DELETE | `/api/trips/<trip_id>` | Delete a trip |

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
- `food_prefs`: any combination of `fine_dining`, `street_food`, `budget_eats`
- `activity_prefs`: any combination of `museums`, `attractions`, `nightlife`, `beaches`, `hiking`

---

### Budget

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budget/<trip_id>/allocate` | Generate and save a budget allocation |
| GET | `/api/budget/<trip_id>/allocate` | Get the saved budget allocation |
| POST | `/api/budget/<trip_id>/savings` | Generate a savings plan |
| GET | `/api/budget/<trip_id>/savings` | Get the saved savings plan |

**POST /api/budget/<trip_id>/savings — Request body:**
```json
{
    "amount_saved": 500
}
```

Run `POST /allocate` before `POST /savings`.

---

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/<trip_id>/analyze` | Get AI feedback on the full budget breakdown |
| POST | `/api/ai/<trip_id>/recommend` | Get AI recommendations for a specific category |

**POST /api/ai/<trip_id>/recommend — Request body:**
```json
{
    "focus": "hotels"
}
```
Valid values for `focus`: `hotels`, `food`, `activities`, `overall`

Run `POST /api/budget/<trip_id>/allocate` before calling either AI endpoint.

---

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations/<trip_id>` | Get all recommendations for a trip |
| GET | `/api/recommendations/<trip_id>?category=hotel` | Get recommendations filtered by category |
| POST | `/api/recommendations/<trip_id>` | Save a recommendation (used by Yelp/Amadeus integration) |
| DELETE | `/api/recommendations/<trip_id>/<rec_id>` | Delete a recommendation |

**POST /api/recommendations/<trip_id> — Request body:**
```json
{
    "category": "hotel",
    "source": "yelp",
    "name": "Hotel Example",
    "external_id": "yelp-business-id",
    "description": "A nice hotel in central Paris",
    "address": "123 Rue de Rivoli, Paris",
    "price": 150.00,
    "price_level": "$$$",
    "rating": 4.5,
    "review_count": 320,
    "image_url": "https://...",
    "booking_url": "https://...",
    "is_ai_pick": false
}
```

Valid values for `category`: `hotel`, `restaurant`, `attraction`, `flight`, `car_rental`
Valid values for `source`: `yelp`, `amadeus`, `ai_generated`

---

## Project Structure
```
CSCI318Project/
├── app.py                  # Flask app factory
├── config.py               # Configuration
├── extensions.py           # Firebase initialization
├── models/                 # Firestore data models
│   ├── user.py
│   ├── trip.py
│   ├── budget.py
│   ├── savings_plan.py
│   └── recommendation.py
├── routes/                 # API route handlers
│   ├── auth.py             # Token verification decorator
│   ├── trips.py
│   ├── budget.py
│   ├── ai.py
│   └── recommendations.py
└── services/               # Business logic
    ├── budget_engine.py    # Rule-based budget allocation
    └── ai_service.py       # OpenAI integration
```
