# extensions.py
import firebase_admin
from firebase_admin import credentials, firestore
import os

db = None

def init_firebase(credentials_path):
    global db
    cred = credentials.Certificate(credentials_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()