"""Task API endpoints."""

from flask import Blueprint, request, jsonify
from utils.decorators import require_auth
from services.task_service import (
    create_task,
    get_tasks,
    get_task_by_id,
    get_task_history,
    update_task
)
from services.status_service import change_task_status
from services.assignment_service import (
    assign_task,
    reassign_task,
    unassign_task,
    claim_task,
    change_visibility
)

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("", methods=["POST"])
@require_auth
def create_task_route(current_user):
    """Create a new task."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "validation_error", "message": "Title is required"}), 400
    
    if len(title) > 200:
        return jsonify({"error": "character_limit_exceeded", "message": "Title must be 200 characters or less"}), 400
    
    description = data.get("description", "")
    if description and len(description) > 10000:
        return jsonify({"error": "character_limit_exceeded", "message": "Description must be 10,000 characters or less"}), 400
    
    priority = data.get("priority", "medium")
    if priority not in ["low", "medium", "high", "critical"]:
        return jsonify({"error": "validation_error", "message": "Invalid priority value"}), 400
    
    visibility = data.get("visibility", "private")
    if visibility not in ["private", "public"]:
        return jsonify({"error": "validation_error", "message": "Invalid visibility value"}), 400
    
    assigned_to = data.get("assigned_to")
    label_ids = data.get("label_ids", [])
    
    try:
        task = create_task(
            title=title,
            created_by=current_user["id"],
            description=description if description else None,
            priority=priority,
            visibility=visibility,
            assigned_to=assigned_to,
            label_ids=label_ids
        )
        return jsonify(task), 201
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("", methods=["GET"])
@require_auth
def list_tasks_route(current_user):
    """List tasks visible to current user with filters."""
    status = request.args.getlist("status")
    priority = request.args.getlist("priority")
    visibility = request.args.get("visibility")
    label_ids = request.args.getlist("label_ids")
    assignee_filter = request.args.get("assignee_filter")
    search = request.args.get("search")
    sort = request.args.get("sort", "newest_first")
    
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        return jsonify({"error": "validation_error", "message": "Invalid pagination parameters"}), 400
    
    if page < 1 or per_page < 1 or per_page > 100:
        return jsonify({"error": "validation_error", "message": "Invalid pagination values"}), 400
    
    if sort not in ["newest_first", "oldest_first", "priority_high_to_low", "priority_low_to_high"]:
        return jsonify({"error": "validation_error", "message": "Invalid sort option"}), 400
    
    try:
        result = get_tasks(
            user_id=current_user["id"],
            status=status if status else None,
            priority=priority if priority else None,
            visibility=visibility,
            label_ids=label_ids if label_ids else None,
            assignee_filter=assignee_filter,
            search=search,
            sort=sort,
            page=page,
            per_page=per_page
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>", methods=["GET"])
@require_auth
def get_task_route(current_user, task_id):
    """Get single task by ID."""
    try:
        task = get_task_by_id(task_id, current_user["id"])
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        return jsonify(task), 200
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>", methods=["PUT"])
@require_auth
def update_task_route(current_user, task_id):
    """Update task details (creator only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    title = data.get("title")
    if title is not None:
        title = title.strip()
        if not title:
            return jsonify({"error": "validation_error", "message": "Title cannot be empty"}), 400
        if len(title) > 200:
            return jsonify({"error": "character_limit_exceeded", "message": "Title must be 200 characters or less"}), 400
    
    description = data.get("description")
    if description is not None and len(description) > 10000:
        return jsonify({"error": "character_limit_exceeded", "message": "Description must be 10,000 characters or less"}), 400
    
    priority = data.get("priority")
    if priority is not None and priority not in ["low", "medium", "high", "critical"]:
        return jsonify({"error": "validation_error", "message": "Invalid priority value"}), 400
    
    visibility = data.get("visibility")
    if visibility is not None and visibility not in ["private", "public"]:
        return jsonify({"error": "validation_error", "message": "Invalid visibility value"}), 400
    
    assigned_to = data.get("assigned_to")
    label_ids = data.get("label_ids")
    
    try:
        task = update_task(
            task_id=task_id,
            user_id=current_user["id"],
            title=title,
            description=description,
            priority=priority,
            visibility=visibility,
            assigned_to=assigned_to,
            label_ids=label_ids
        )
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found or you don't have permission"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/status", methods=["PATCH"])
@require_auth
def change_status_route(current_user, task_id):
    """Change task status with workflow validation."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "validation_error", "message": "Status is required"}), 400
    
    if new_status not in ["pending", "in_progress", "ready_for_review", "completed", "cancelled"]:
        return jsonify({"error": "validation_error", "message": "Invalid status value"}), 400
    
    completion_note = data.get("completion_note")
    review_feedback = data.get("review_feedback")
    cancellation_reason = data.get("cancellation_reason")
    reopen_reason = data.get("reopen_reason")
    
    try:
        task = change_task_status(
            task_id=task_id,
            user_id=current_user["id"],
            new_status=new_status,
            completion_note=completion_note,
            review_feedback=review_feedback,
            cancellation_reason=cancellation_reason,
            reopen_reason=reopen_reason
        )
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found or you don't have permission"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "invalid_transition", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/assign", methods=["PATCH"])
@require_auth
def assign_task_route(current_user, task_id):
    """Assign task to a user (creator only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    assignee_id = data.get("assignee_id")
    if not assignee_id:
        return jsonify({"error": "validation_error", "message": "Assignee ID is required"}), 400
    
    try:
        task = assign_task(task_id, current_user["id"], assignee_id)
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/reassign", methods=["PATCH"])
@require_auth
def reassign_task_route(current_user, task_id):
    """Reassign task to different user (creator only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    new_assignee_id = data.get("assignee_id")
    if not new_assignee_id:
        return jsonify({"error": "validation_error", "message": "Assignee ID is required"}), 400
    
    reassignment_reason = data.get("reassignment_reason")
    
    try:
        task = reassign_task(task_id, current_user["id"], new_assignee_id, reassignment_reason)
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/unassign", methods=["PATCH"])
@require_auth
def unassign_task_route(current_user, task_id):
    """Remove assignee from task (creator only)."""
    try:
        task = unassign_task(task_id, current_user["id"])
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/claim", methods=["PATCH"])
@require_auth
def claim_task_route(current_user, task_id):
    """Claim public unassigned task."""
    try:
        task = claim_task(task_id, current_user["id"])
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/visibility", methods=["PATCH"])
@require_auth
def change_visibility_route(current_user, task_id):
    """Change task visibility (creator only)."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "validation_error", "message": "Request body required"}), 400
    
    new_visibility = data.get("visibility")
    if not new_visibility:
        return jsonify({"error": "validation_error", "message": "Visibility is required"}), 400
    
    try:
        task = change_visibility(task_id, current_user["id"], new_visibility)
        
        if not task:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        
        return jsonify(task), 200
    except ValueError as e:
        return jsonify({"error": "validation_error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "internal_error", "message": str(e)}), 500


@tasks_bp.route("/<task_id>/history", methods=["GET"])
@require_auth
def get_history_route(current_user, task_id):
    try:
        history = get_task_history(task_id, current_user["id"])
        if history is None:
            return jsonify({"error": "not_found", "message": "Task not found"}), 404
        return jsonify({"history": history}), 200
    except Exception:
        return jsonify({"error": "internal_error", "message": "Failed to fetch history"}), 500
