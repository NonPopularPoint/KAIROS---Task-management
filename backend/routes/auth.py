"""Authentication routes for Google OAuth and JWT token management."""

from flask import Blueprint, request, jsonify, g
from services.auth_service import verify_google_token, upsert_user, get_user_by_id
from utils.jwt_utils import generate_token
from utils.decorators import require_auth


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/google", methods=["POST"])
def google_login():
    """Verify Google token and return JWT."""
    data = request.get_json()
    if not data or "token" not in data:
        return jsonify({"error": "validation_error", "message": "Google token is required"}), 400
    
    user_info = verify_google_token(data["token"])
    if user_info is None:
        return jsonify({"error": "unauthorized", "message": "Invalid or expired Google token"}), 401
    
    user = upsert_user(
        google_id=user_info["google_id"],
        email=user_info["email"],
        name=user_info["name"],
        avatar_url=user_info["avatar_url"]
    )
    
    if user is None:
        return jsonify({"error": "internal_error", "message": "Failed to create or update user account"}), 500
    
    jwt_token = generate_token(user["id"])
    
    return jsonify({"token": jwt_token, "user": user}), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user(current_user):
    """Get current authenticated user."""
    return jsonify(current_user), 200


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout(current_user):
    """Logout endpoint (stateless - frontend discards token)."""
    return jsonify({"message": "Logged out successfully"}), 200
