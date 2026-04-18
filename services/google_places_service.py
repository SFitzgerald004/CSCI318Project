# google_places_serivce.py
import json, os, re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.websiteUri",
    "places.googleMapsUri",
])

# Used to map and normalize recieved price levels for UI
PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": "$",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}

CATEGORY_HINTS = {
    "hotel": "hotel",
    "restaurant": "restaurant",
    "attraction": "attraction",
    "flight": "flight",
    "car_rental": "car rental"
}

def normalize_text(value):
    if not value:
        return "nil"
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def token_set(value):
    return set(normalize_text(value).split())

def name_overlap_score(query_name, candidate_name):
    query_tokens = token_set(query_name)
    candidate_tokens = token_set(candidate_name)

    if not query_tokens or not candidate_tokens:
        return 0.0
    
    shared = query_tokens & candidate_tokens
    return len(shared) / len(query_tokens)

def build_text_query(name, category, trip):
    category_hint = CATEGORY_HINTS.get(category, "place")
    destination = trip.get("destination", "")
    country = trip.get("destination_country", "")

    location_bits = ", ".join(part for part in [destination, country] if part)
    if location_bits:
        return f"{name} {category_hint} in {location_bits}"
    return f"{name} {category_hint}"

def build_payload(name, category, trip):
    return {
        "textQuery": build_text_query(name, category, trip),
        "pageSize": 5,
        "languageCode": "en"
    }

def google_api_key():
    return os.getenv("GOOGLE_MAPS_API_KEY")

def search_place(name, category, trip):
    api_key = google_api_key()
    if not api_key:
        return None
    
    payload = build_payload(name, category, trip)
    request = Request(
        TEXT_SEARCH_URL,
        data = json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application,json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": FIELD_MASK
        },
        method="POST"
    )

    try:
        with urlopen(request, timeout=8) as response:
            data=json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None
    
    places = data.get("places", [])
    if not places:
        return None
    
    ranked = sorted(
        places,
        key=lambda place: (
            name_overlap_score(name, place.get("displayName", {}).get("text", "")),
            place.get("userRatingCount", 0),
            place.get("rating", 0)
        ),
        reverse=True
    )

    best = ranked[0]
    score = name_overlap_score(name, best.get("displayName", {}).get("text", ""))

    if score < 0.5:
        return None
    
    return best

def normalize_place(place):
    if not place:
        return {}
    
    return {
        "external_id": place.get("id"),
        "rating": place.get("rating"),
        "review_count": place.get("userRatingCount"),
        "address": place.get("formattedAddress"),
        "price_level": PRICE_LEVEL_MAP.get(place.get("priceLevel")),
        "booking_url": place.get("websiteUri") or place.get("googleMapsUri")
    }

def enrich_recommendations(name, category, trip):
    place = search_place(name, category, trip)
    return normalize_place(place)