from typing import Dict, Any, List
from utils.supabase_client import get_supabase


def get_dashboard_metrics(user_id: str) -> Dict[str, int]:
    supabase = get_supabase()
    result = supabase.table("tasks").select("id, status, created_by, assigned_to, visibility").execute()
    tasks = result.data if result.data else []

    visible = [
        t for t in tasks
        if t["visibility"] == "public"
        or t["created_by"] == user_id
        or t["assigned_to"] == user_id
    ]

    total = len(visible)
    pending = sum(1 for t in visible if t["status"] == "pending")
    in_progress = sum(1 for t in visible if t["status"] == "in_progress")
    ready_for_review = sum(1 for t in visible if t["status"] == "ready_for_review")
    completed = sum(1 for t in visible if t["status"] == "completed")
    cancelled = sum(1 for t in visible if t["status"] == "cancelled")
    assigned_to_me = sum(1 for t in visible if t.get("assigned_to") == user_id)
    created_by_me = sum(1 for t in visible if t["created_by"] == user_id)
    unassigned_public = sum(
        1 for t in visible
        if t["visibility"] == "public" and t.get("assigned_to") is None
    )

    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "ready_for_review": ready_for_review,
        "completed": completed,
        "cancelled": cancelled,
        "assigned_to_me": assigned_to_me,
        "created_by_me": created_by_me,
        "unassigned_public": unassigned_public,
    }


def get_recent_activity(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    supabase = get_supabase()
    tasks_result = supabase.table("tasks").select("id, created_by, assigned_to, visibility").execute()
    tasks = tasks_result.data if tasks_result.data else []

    visible_task_ids = [
        t["id"] for t in tasks
        if t["visibility"] == "public"
        or t["created_by"] == user_id
        or t["assigned_to"] == user_id
    ]

    if not visible_task_ids:
        return []

    result = (
        supabase.table("task_history")
        .select("*, user:users(id, name, email, avatar_url)")
        .in_("task_id", visible_task_ids)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data if result.data else []


def get_weekly_chart(user_id: str) -> dict:
    from datetime import datetime, timedelta

    supabase = get_supabase()
    tasks_result = supabase.table("tasks").select("id, completed_at, created_by, assigned_to, visibility").execute()
    tasks = tasks_result.data if tasks_result.data else []

    visible_task_ids = [
        t["id"] for t in tasks
        if t["visibility"] == "public"
        or t["created_by"] == user_id
        or t["assigned_to"] == user_id
    ]

    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    daily_counts = {day: 0 for day in day_names}

    for t in tasks:
        if t["id"] in visible_task_ids and t.get("completed_at"):
            completed_date = datetime.fromisoformat(t["completed_at"].replace("Z", "+00:00")).date()
            if monday <= completed_date <= today:
                day_idx = completed_date.weekday()
                daily_counts[day_names[day_idx]] += 1

    return [{"day": day, "count": count} for day, count in daily_counts.items()]
