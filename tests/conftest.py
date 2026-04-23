"""Pytest configuration — sets harmless defaults for env vars that would
crash module imports if absent (e.g., openai.OpenAI(api_key=None) raises
at construction time, causing test collection to fail on CI/fresh machines)."""
import os

os.environ.setdefault("OPENAI_API_KEY", "test-key-not-used")
os.environ.setdefault("FIREBASE_CREDENTIALS", "firebase.json")
