# app.py
from flask import Flask
from config import Config
from extensions import init_firebase

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_firebase(app.config['FIREBASE_CREDENTIALS'])

    # Route blueprint registers
    from routes.trips import trips_bp
    app.register_blueprint(trips_bp)

    from routes.budget import budget_bp
    app.register_blueprint(budget_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)