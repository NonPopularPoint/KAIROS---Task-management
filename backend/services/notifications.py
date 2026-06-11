from typing import Optional, Dict, Any
from utils.supabase_client import get_supabase
from services.email_service import (
    send_email_async, render_email,
    TASK_ASSIGNED_SUBJECT, TASK_ASSIGNED_MESSAGE,
    TASK_REASSIGNED_SUBJECT, TASK_REASSIGNED_MESSAGE,
    TASK_REASSIGNED_PREV_SUBJECT, TASK_REASSIGNED_PREV_MESSAGE,
    TASK_UNASSIGNED_SUBJECT, TASK_UNASSIGNED_MESSAGE,
    TASK_CLAIMED_SUBJECT, TASK_CLAIMED_MESSAGE,
    TASK_READY_FOR_REVIEW_SUBJECT, TASK_READY_FOR_REVIEW_MESSAGE,
    TASK_APPROVED_SUBJECT, TASK_APPROVED_MESSAGE,
    TASK_CHANGES_REQUESTED_SUBJECT, TASK_CHANGES_REQUESTED_MESSAGE,
    TASK_CANCELLED_SUBJECT, TASK_CANCELLED_MESSAGE,
    TASK_REOPENED_SUBJECT, TASK_REOPENED_MESSAGE,
)


def _get_user(user_id: str) -> Optional[Dict[str, Any]]:
    result = get_supabase().table("users").select("id, name, email").eq("id", user_id).execute()
    return result.data[0] if result.data else None


def _build_and_send(to_user: dict, subject_tpl: str, message_tpl: str,
                    task: dict, note: Optional[str] = None, **fmt_kwargs):
    subject = subject_tpl.format(task_title=task["title"], **fmt_kwargs)
    message = message_tpl.format(**fmt_kwargs)
    html = render_email(
        recipient_name=to_user["name"],
        message=message,
        task_title=task["title"],
        task_status=task["status"],
        task_priority=task["priority"],
        task_id=task.get("id", ""),
        note=note
    )
    send_email_async(to_user["email"], subject, html)


def notify_task_assigned(task: dict, assignee_id: str, creator_id: str):
    if assignee_id == creator_id:
        return
    assignee = _get_user(assignee_id)
    if not assignee:
        return
    _build_and_send(
        assignee, TASK_ASSIGNED_SUBJECT, TASK_ASSIGNED_MESSAGE, task,
        creator_name=task["created_by"]["name"]
    )


def notify_task_reassigned(task: dict, previous_id: str, new_id: str, creator_id: str, reason: str = None):
    new_assignee = _get_user(new_id)
    if new_assignee and new_id != creator_id:
        _build_and_send(
            new_assignee, TASK_REASSIGNED_SUBJECT, TASK_REASSIGNED_MESSAGE, task,
            creator_name=task["created_by"]["name"]
        )

    if task["status"] == "in_progress":
        previous_assignee = _get_user(previous_id)
        if previous_assignee and previous_id != creator_id:
            _build_and_send(
                previous_assignee, TASK_REASSIGNED_PREV_SUBJECT, TASK_REASSIGNED_PREV_MESSAGE,
                task, reason=reason or "No reason provided"
            )


def notify_task_unassigned(task: dict, removed_id: str, creator_id: str):
    if removed_id == creator_id:
        return
    removed = _get_user(removed_id)
    if not removed:
        return
    _build_and_send(
        removed, TASK_UNASSIGNED_SUBJECT, TASK_UNASSIGNED_MESSAGE, task,
        creator_name=task["created_by"]["name"]
    )


def notify_task_claimed(task: dict, claimant_id: str):
    if claimant_id == task["created_by"]["id"]:
        return
    claimant = _get_user(claimant_id)
    if not claimant:
        return
    _build_and_send(
        task["created_by"], TASK_CLAIMED_SUBJECT, TASK_CLAIMED_MESSAGE, task,
        claimant_name=claimant["name"]
    )


def notify_ready_for_review(task: dict, assignee_id: str, creator_id: str, note: str):
    if assignee_id == creator_id or not task.get("assigned_to"):
        return
    _build_and_send(
        task["created_by"], TASK_READY_FOR_REVIEW_SUBJECT, TASK_READY_FOR_REVIEW_MESSAGE,
        task, note=note, assignee_name=task["assigned_to"]["name"]
    )


def notify_task_approved(task: dict, assignee_id: str, creator_id: str):
    if assignee_id == creator_id or not task.get("assigned_to"):
        return
    _build_and_send(
        task["assigned_to"], TASK_APPROVED_SUBJECT, TASK_APPROVED_MESSAGE, task,
        creator_name=task["created_by"]["name"]
    )


def notify_changes_requested(task: dict, assignee_id: str, creator_id: str, feedback: str):
    if assignee_id == creator_id or not task.get("assigned_to"):
        return
    _build_and_send(
        task["assigned_to"], TASK_CHANGES_REQUESTED_SUBJECT, TASK_CHANGES_REQUESTED_MESSAGE,
        task, note=feedback, creator_name=task["created_by"]["name"]
    )


def notify_task_cancelled(task: dict, assignee_id: str, creator_id: str, reason: str):
    if not task.get("assigned_to") or assignee_id == creator_id:
        return
    _build_and_send(
        task["assigned_to"], TASK_CANCELLED_SUBJECT, TASK_CANCELLED_MESSAGE,
        task, note=reason, creator_name=task["created_by"]["name"]
    )


def notify_task_reopened(task: dict, assignee_id: str, creator_id: str, reason: str = None):
    if not task.get("assigned_to") or assignee_id == creator_id:
        return
    _build_and_send(
        task["assigned_to"], TASK_REOPENED_SUBJECT, TASK_REOPENED_MESSAGE,
        task, note=reason, creator_name=task["created_by"]["name"]
    )
