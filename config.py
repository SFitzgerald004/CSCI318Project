# config.py
import os 
from dotenv import load_dotenv

load_dotenv()

class Config:
    FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    FLIGHT_API_KEY = os.getenv('FLIGHT_API_KEY')
    # AMAEDUS_API_KEY = os.getenv('AMADEUS_API_KEY')
    # AMADEUS_API_SECRET = os.getenv('AMADEUS_API_SECRET')