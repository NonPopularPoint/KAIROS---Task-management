from flask import Blueprint, jsonify
from utils.decorators import require_auth
from services.labels_service import get_all_labels

labels_bp = Blueprint("labels", __name__)


@labels_bp.route("", methods=["GET"])
@require_auth
def list_labels(current_user):
    try:
        labels = get_all_labels()
        return jsonify({"labels": labels}), 200
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch labels"}), 500
