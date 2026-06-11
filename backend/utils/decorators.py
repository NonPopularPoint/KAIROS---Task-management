"""Authentication decorators for Flask routes."""

from functools import wraps
from flask import request, jsonify
from utils.jwt_utils import verify_token
from services.auth_service import get_user_by_id


def require_auth(f):
    """
    Decorator: require a valid JWT in the Authorization header.
    
    Fetches current user from database on each request.
    This ensures user data is always fresh (name, email, avatar updates reflected immediately).
    Single query by primary key is fast enough for production SaaS.
    If performance becomes bottleneck, add Redis caching layer.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "unauthorized", "message": "Missing or invalid token"}), 401

        token = auth_header.split(" ", 1)[1]
        user_id = verify_token(token)
        
        if user_id is None:
            return jsonify({"error": "unauthorized", "message": "Token expired or invalid"}), 401
        
        current_user = get_user_by_id(user_id)
        
        if current_user is None:
            return jsonify({"error": "unauthorized", "message": "User not found"}), 401
        
        return f(current_user, *args, **kwargs)

    return decorated
