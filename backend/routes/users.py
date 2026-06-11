from flask import Blueprint, jsonify
from services.user_service import get_all_users, get_user_by_id
from utils.decorators import require_auth


users_bp = Blueprint("users", __name__)


@users_bp.route("", methods=["GET"])
@require_auth
def list_users(current_user):
    users = get_all_users()
    if users is None:
        return jsonify({"error": "internal_error", "message": "Failed to fetch users"}), 500
    return jsonify({"users": users}), 200


@users_bp.route("/<user_id>", methods=["GET"])
@require_auth
def get_user(current_user, user_id):
    user = get_user_by_id(user_id)
    if user is None:
        return jsonify({"error": "not_found", "message": "User not found"}), 404
    return jsonify({"user": user}), 200
