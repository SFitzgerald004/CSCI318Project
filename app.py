# app.py
from flask import Flask
from config import Config
from extensions import db, bcrypt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)

    with app.app_context():
        import models
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)