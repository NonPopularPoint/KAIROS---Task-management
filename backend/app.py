"""KAIROS — Task Management Backend API."""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS — restrict to frontend origin in production
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    CORS(app, resources={r"/api/*": {"origins": [frontend_origin]}}, supports_credentials=True)

    # --- Error Handlers ---
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "bad_request", "message": "Invalid request"}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "unauthorized", "message": "Authentication required"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "forbidden", "message": "Access denied"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "internal_error", "message": "An unexpected error occurred"}), 500

    # --- Register Blueprints ---
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.tasks import tasks_bp
    from routes.labels import labels_bp
    from routes.comments import comments_bp
    from routes.dashboard import dashboard_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(labels_bp, url_prefix="/api/labels")
    app.register_blueprint(comments_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    
    # Phase 3 blueprints (to be uncommented when implemented):
    # from routes.comments import comments_bp
    # from routes.labels import labels_bp
    # from routes.dashboard import dashboard_bp
    # app.register_blueprint(comments_bp, url_prefix="/api")
    # app.register_blueprint(labels_bp, url_prefix="/api/labels")
    # app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # --- Health Check ---
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "KAIROS API"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, port=5000)
