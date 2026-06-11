from flask import Blueprint, jsonify
from utils.decorators import require_auth
from services.dashboard_service import get_dashboard_metrics, get_recent_activity, get_weekly_chart

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/metrics", methods=["GET"])
@require_auth
def metrics(current_user):
    try:
        data = get_dashboard_metrics(current_user["id"])
        return jsonify({"metrics": data}), 200
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch metrics"}), 500


@dashboard_bp.route("/recent-activity", methods=["GET"])
@require_auth
def recent_activity(current_user):
    try:
        data = get_recent_activity(current_user["id"])
        return jsonify({"activity": data}), 200
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch activity"}), 500


@dashboard_bp.route("/weekly-chart", methods=["GET"])
@require_auth
def weekly_chart(current_user):
    try:
        data = get_weekly_chart(current_user["id"])
        return jsonify({"chart": data}), 200
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch chart data"}), 500
