# app.py
from flask import Flask
from config import Config
from extensions import init_firebase

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_firebase(app.config['FIREBASE_CREDENTIALS'])

    #from routes.auth import auth_bp
    #app.register_blueprint(auth_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)