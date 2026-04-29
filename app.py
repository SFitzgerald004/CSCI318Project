# app.py
from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import init_firebase
                                                                                                                                                
def create_app():
    app = Flask(__name__)                                                                                                                      
    app.config.from_object(Config)

    init_firebase(app.config['FIREBASE_CREDENTIALS'])
    CORS(app)

    from routes.trips import trips_bp
    from routes.budget import budget_bp
    from routes.ai import ai_bp
    from routes.recommendations import recommendations_bp
    from routes.flights import flights_bp

    app.register_blueprint(trips_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(flights_bp)
                                                                                                                                                
    return app
                                                                                                                                                
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5001)