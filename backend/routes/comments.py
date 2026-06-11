from flask import Blueprint, request, jsonify
from utils.decorators import require_auth
from services.comment_service import get_comments, add_comment, edit_comment, delete_comment

comments_bp = Blueprint("comments", __name__)


@comments_bp.route("/tasks/<task_id>/comments", methods=["GET"])
@require_auth
def list_comments(current_user, task_id):
    try:
        comments = get_comments(task_id, current_user["id"])
        if comments is None:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        return jsonify({"comments": comments}), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch comments"}), 500


@comments_bp.route("/tasks/<task_id>/comments", methods=["POST"])
@require_auth
def create_comment(current_user, task_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400

    message = data.get("message", "")
    try:
        comment = add_comment(task_id, current_user["id"], message)
        return jsonify(comment), 201
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to add comment"}), 500


@comments_bp.route("/comments/<comment_id>", methods=["PUT"])
@require_auth
def update_comment(current_user, comment_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400

    message = data.get("message", "")
    try:
        comment = edit_comment(comment_id, current_user["id"], message)
        return jsonify(comment), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to update comment"}), 500


@comments_bp.route("/comments/<comment_id>", methods=["DELETE"])
@require_auth
def remove_comment(current_user, comment_id):
    try:
        delete_comment(comment_id, current_user["id"])
        return jsonify({"message": "Comment deleted"}), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to delete comment"}), 500
