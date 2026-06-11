from datetime import datetime
from typing import Optional, Dict, Any, List
from utils.supabase_client import get_supabase


def get_comments(task_id: str, user_id: str) -> Optional[List[Dict[str, Any]]]:
    from services.task_service import get_task_by_id

    task = get_task_by_id(task_id, user_id)
    if not task:
        return None

    supabase = get_supabase()
    result = (
        supabase.table("comments")
        .select("*, user:users(id, name, email, avatar_url)")
        .eq("task_id", task_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data if result.data else []


def add_comment(task_id: str, user_id: str, message: str) -> Dict[str, Any]:
    from services.task_service import get_task_by_id

    task = get_task_by_id(task_id, user_id)
    if not task:
        raise ValueError("Task not found")

    if not message or not message.strip():
        raise ValueError("Comment cannot be empty")

    if len(message) > 2000:
        raise ValueError("Comment must be 2000 characters or less")

    supabase = get_supabase()
    result = (
        supabase.table("comments")
        .insert(
            {
                "task_id": task_id,
                "user_id": user_id,
                "message": message.strip(),
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )

    comment = result.data[0]

    user_result = supabase.table("users").select("id, name, email, avatar_url").eq("id", user_id).execute()
    comment["user"] = user_result.data[0] if user_result.data else None

    return comment


def edit_comment(comment_id: str, user_id: str, message: str) -> Dict[str, Any]:
    supabase = get_supabase()
    result = supabase.table("comments").select("*").eq("id", comment_id).execute()

    if not result.data:
        raise ValueError("Comment not found")

    comment = result.data[0]

    if comment["user_id"] != user_id:
        raise ValueError("You can only edit your own comments")

    if not message or not message.strip():
        raise ValueError("Comment cannot be empty")

    if len(message) > 2000:
        raise ValueError("Comment must be 2000 characters or less")

    from services.task_service import get_task_by_id

    task = get_task_by_id(comment["task_id"], user_id)
    if not task:
        raise ValueError("Task not found")

    supabase.table("comments").update(
        {"message": message.strip(), "updated_at": datetime.utcnow().isoformat()}
    ).eq("id", comment_id).execute()

    updated = supabase.table("comments").select("*, user:users(id, name, email, avatar_url)").eq("id", comment_id).execute()
    return updated.data[0]


def delete_comment(comment_id: str, user_id: str) -> None:
    from services.task_service import get_task_by_id

    supabase = get_supabase()
    result = supabase.table("comments").select("*").eq("id", comment_id).execute()

    if not result.data:
        raise ValueError("Comment not found")

    comment = result.data[0]

    if comment["user_id"] == user_id:
        supabase.table("comments").delete().eq("id", comment_id).execute()
        return

    task = get_task_by_id(comment["task_id"], user_id)
    if task and task["created_by"]["id"] == user_id:
        supabase.table("comments").delete().eq("id", comment_id).execute()
        return

    raise ValueError("You can only delete your own comments")
