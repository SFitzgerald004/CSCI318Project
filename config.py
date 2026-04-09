# config.py
import os 
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')