"""Task assignment operations - assign, reassign, unassign, claim, visibility."""

from typing import Optional, Dict, Any
from datetime import datetime
from utils.supabase_client import get_supabase


def assign_task(task_id: str, user_id: str, assignee_id: str) -> Optional[Dict[str, Any]]:
    """Assign task to a user (creator only)."""
    from services.task_service import get_task_by_id
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    if task["created_by"]["id"] != user_id:
        raise ValueError("Only task creator can assign tasks")
    
    if task["status"] == "completed":
        raise ValueError("Cannot modify completed tasks")
    
    if task.get("assigned_to"):
        raise ValueError("Task already has an assignee. Use /reassign instead.")
    
    user_check = supabase.table("users").select("id").eq("id", assignee_id).execute()
    if not user_check.data:
        raise ValueError("Assignee not found")
    
    supabase.table("tasks").update({"assigned_to": assignee_id}).eq("id", task_id).execute()
    
    is_self_assign = user_id == assignee_id
    
    history_entry = {
        "task_id": task_id,
        "event_type": "task_assigned",
        "user_id": user_id,
        "details": {
            "assignee_id": assignee_id,
            "self_assigned": is_self_assign
        },
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    task = get_task_by_id(task_id, user_id)
    
    from services.notifications import notify_task_assigned
    notify_task_assigned(task, assignee_id, user_id)
    
    return task


def reassign_task(
    task_id: str,
    user_id: str,
    new_assignee_id: str,
    reassignment_reason: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Reassign task to different user (creator only)."""
    from services.task_service import get_task_by_id
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    if task["created_by"]["id"] != user_id:
        raise ValueError("Only task creator can reassign tasks")
    
    if task["status"] == "completed":
        raise ValueError("Cannot modify completed tasks")
    
    if task["status"] == "ready_for_review":
        raise ValueError("Cannot reassign tasks in Ready For Review status")
    
    if not task.get("assigned_to"):
        raise ValueError("Task is not assigned")
    
    previous_assignee_id = task["assigned_to"]["id"]
    
    if previous_assignee_id == new_assignee_id:
        raise ValueError("Task already assigned to this user")
    
    user_check = supabase.table("users").select("id").eq("id", new_assignee_id).execute()
    if not user_check.data:
        raise ValueError("New assignee not found")
    
    if task["status"] == "in_progress":
        if not reassignment_reason or not reassignment_reason.strip():
            raise ValueError("Reassignment reason required for In Progress tasks")
        if len(reassignment_reason) > 1000:
            raise ValueError("Reassignment reason must be 1000 characters or less")
    
    supabase.table("tasks").update({"assigned_to": new_assignee_id}).eq("id", task_id).execute()
    
    details = {
        "previous_assignee_id": previous_assignee_id,
        "new_assignee_id": new_assignee_id
    }
    
    if reassignment_reason and reassignment_reason.strip():
        details["reason"] = reassignment_reason.strip()
    
    history_entry = {
        "task_id": task_id,
        "event_type": "task_reassigned",
        "user_id": user_id,
        "details": details,
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    task = get_task_by_id(task_id, user_id)
    
    from services.notifications import notify_task_reassigned
    notify_task_reassigned(task, previous_assignee_id, new_assignee_id, user_id,
                          reassignment_reason.strip() if reassignment_reason else None)
    
    return task


def unassign_task(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Remove assignee from task (creator only, Pending/In Progress only)."""
    from services.task_service import get_task_by_id
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    if task["created_by"]["id"] != user_id:
        raise ValueError("Only task creator can unassign tasks")
    
    if task["status"] == "completed":
        raise ValueError("Cannot modify completed tasks")
    
    if task["status"] == "ready_for_review":
        raise ValueError("Cannot unassign tasks in Ready For Review status")
    
    if not task.get("assigned_to"):
        raise ValueError("Task is not assigned")
    
    if task["status"] not in ["pending", "in_progress"]:
        raise ValueError("Can only unassign Pending or In Progress tasks")
    
    previous_assignee_id = task["assigned_to"]["id"]
    
    supabase.table("tasks").update({"assigned_to": None}).eq("id", task_id).execute()
    
    history_entry = {
        "task_id": task_id,
        "event_type": "task_unassigned",
        "user_id": user_id,
        "details": {"previous_assignee_id": previous_assignee_id},
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    task = get_task_by_id(task_id, user_id)
    
    from services.notifications import notify_task_unassigned
    notify_task_unassigned(task, previous_assignee_id, user_id)
    
    return task


def claim_task(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Claim public unassigned task."""
    from services.task_service import get_task_by_id
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    if task["visibility"] != "public":
        raise ValueError("Can only claim public tasks")
    
    if task.get("assigned_to"):
        raise ValueError("Task is already assigned")
    
    if task["status"] in ["completed", "cancelled"]:
        raise ValueError("Cannot claim completed or cancelled tasks")
    
    supabase.table("tasks").update({"assigned_to": user_id}).eq("id", task_id).execute()
    
    is_self_claim = task["created_by"]["id"] == user_id
    
    history_entry = {
        "task_id": task_id,
        "event_type": "task_assigned" if is_self_claim else "task_claimed",
        "user_id": user_id,
        "details": {"claimant_id": user_id},
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    task = get_task_by_id(task_id, user_id)
    
    from services.notifications import notify_task_claimed
    notify_task_claimed(task, user_id)
    
    return task


def change_visibility(task_id: str, user_id: str, new_visibility: str) -> Optional[Dict[str, Any]]:
    """Change task visibility (creator only, not Completed)."""
    from services.task_service import get_task_by_id
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    if task["created_by"]["id"] != user_id:
        raise ValueError("Only task creator can change visibility")
    
    if task["status"] == "completed":
        raise ValueError("Cannot change visibility of completed tasks")
    
    if new_visibility not in ["private", "public"]:
        raise ValueError("Invalid visibility value")
    
    if task["visibility"] == new_visibility:
        raise ValueError("Task already has this visibility")
    
    supabase.table("tasks").update({"visibility": new_visibility}).eq("id", task_id).execute()
    
    return get_task_by_id(task_id, user_id)
