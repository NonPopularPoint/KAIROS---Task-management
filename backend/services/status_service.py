"""Task status management and workflow transitions."""

from typing import Optional, Dict, Any
from datetime import datetime
from utils.supabase_client import get_supabase


def change_task_status(
    task_id: str,
    user_id: str,
    new_status: str,
    completion_note: Optional[str] = None,
    review_feedback: Optional[str] = None,
    cancellation_reason: Optional[str] = None,
    reopen_reason: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Change task status with validation of allowed transitions.
    
    Returns updated task or None if transition invalid/unauthorized.
    """
    from services.task_service import get_task_by_id, format_task
    
    supabase = get_supabase()
    task = get_task_by_id(task_id, user_id)
    
    if not task:
        return None
    
    current_status = task["status"]
    is_creator = task["created_by"]["id"] == user_id
    is_assignee = task.get("assigned_to") and task["assigned_to"]["id"] == user_id
    
    if current_status == "completed":
        raise ValueError("Cannot modify completed tasks")
    
    valid_transition = False
    event_type = "status_changed"
    event_details = {
        "old_status": current_status,
        "new_status": new_status
    }
    comment_text = None
    
    if new_status == "in_progress":
        if current_status == "pending" and is_assignee:
            valid_transition = True
        elif current_status == "ready_for_review" and is_creator:
            if not review_feedback or not review_feedback.strip():
                raise ValueError("Review feedback required when requesting changes")
            if len(review_feedback) > 2000:
                raise ValueError("Review feedback must be 2000 characters or less")
            valid_transition = True
            event_type = "review_changes_requested"
            event_details["feedback"] = review_feedback[:100]
            comment_text = review_feedback
    
    elif new_status == "ready_for_review":
        if current_status == "in_progress" and is_assignee:
            if not completion_note or not completion_note.strip():
                raise ValueError("Completion note required when submitting for review")
            if len(completion_note) > 2000:
                raise ValueError("Completion note must be 2000 characters or less")
            valid_transition = True
            event_type = "task_submitted_for_review"
            event_details["note"] = completion_note[:100]
            comment_text = completion_note
    
    elif new_status == "completed":
        if current_status == "ready_for_review" and is_creator:
            valid_transition = True
            event_type = "task_approved_completed"
    
    elif new_status == "cancelled":
        if current_status in ["pending", "in_progress", "ready_for_review"] and is_creator:
            if not cancellation_reason or not cancellation_reason.strip():
                raise ValueError("Cancellation reason required when cancelling task")
            if len(cancellation_reason) > 1000:
                raise ValueError("Cancellation reason must be 1000 characters or less")
            valid_transition = True
            event_type = "task_cancelled"
            event_details["reason"] = cancellation_reason[:100]
            comment_text = cancellation_reason
    
    elif new_status == "pending":
        if current_status == "cancelled" and is_creator:
            if reopen_reason and len(reopen_reason) > 1000:
                raise ValueError("Reopen reason must be 1000 characters or less")
            valid_transition = True
            event_type = "task_reopened"
            if reopen_reason and reopen_reason.strip():
                event_details["reason"] = reopen_reason[:100]
                comment_text = reopen_reason
    
    if not valid_transition:
        raise ValueError(f"Invalid transition from {current_status} to {new_status} for your role")
    
    updates = {"status": new_status}
    
    if new_status == "completed":
        updates["completed_at"] = datetime.utcnow().isoformat()
    
    supabase.table("tasks").update(updates).eq("id", task_id).execute()
    
    if comment_text:
        comment_data = {
            "task_id": task_id,
            "user_id": user_id,
            "message": comment_text.strip(),
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("comments").insert(comment_data).execute()
    
    history_entry = {
        "task_id": task_id,
        "event_type": event_type,
        "user_id": user_id,
        "details": event_details,
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    task = get_task_by_id(task_id, user_id)
    
    from services.notifications import (
        notify_ready_for_review, notify_task_approved,
        notify_changes_requested, notify_task_cancelled, notify_task_reopened
    )
    
    if event_type == "task_submitted_for_review":
        notify_ready_for_review(task, task["assigned_to"]["id"] if task.get("assigned_to") else None, task["created_by"]["id"], completion_note)
    elif event_type == "task_approved_completed":
        notify_task_approved(task, task["assigned_to"]["id"] if task.get("assigned_to") else None, task["created_by"]["id"])
    elif event_type == "review_changes_requested":
        notify_changes_requested(task, task["assigned_to"]["id"] if task.get("assigned_to") else None, task["created_by"]["id"], review_feedback)
    elif event_type == "task_cancelled":
        notify_task_cancelled(task, task["assigned_to"]["id"] if task.get("assigned_to") else None, task["created_by"]["id"], cancellation_reason)
    elif event_type == "task_reopened":
        notify_task_reopened(task, task["assigned_to"]["id"] if task.get("assigned_to") else None, task["created_by"]["id"], reopen_reason)
    
    return task
