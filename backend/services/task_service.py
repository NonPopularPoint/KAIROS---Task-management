"""Task business logic and data access."""

from typing import Optional, Dict, List, Any
from datetime import datetime
from utils.supabase_client import get_supabase


def create_task(
    title: str,
    created_by: str,
    description: Optional[str] = None,
    priority: str = "medium",
    visibility: str = "private",
    assigned_to: Optional[str] = None,
    label_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Create a new task with defaults."""
    supabase = get_supabase()
    
    task_data = {
        "title": title.strip()[:200],
        "description": description.strip()[:10000] if description else None,
        "status": "pending",
        "priority": priority,
        "visibility": visibility,
        "created_by": created_by,
        "assigned_to": assigned_to,
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }
    
    result = supabase.table("tasks").insert(task_data).execute()
    
    if not result.data:
        raise Exception("Failed to create task")
    
    task = result.data[0]
    task_id = task["id"]
    
    if label_ids:
        from services.labels_service import validate_label_ids
        label_ids = validate_label_ids(label_ids)
        
        label_associations = [
            {"task_id": task_id, "label_id": label_id}
            for label_id in label_ids
        ]
        supabase.table("task_labels").insert(label_associations).execute()
    
    history_entry = {
        "task_id": task_id,
        "event_type": "task_created",
        "user_id": created_by,
        "details": None,
        "created_at": datetime.utcnow().isoformat()
    }
    supabase.table("task_history").insert(history_entry).execute()
    
    return get_task_by_id(task_id, created_by)


def get_tasks(
    user_id: str,
    status: Optional[List[str]] = None,
    priority: Optional[List[str]] = None,
    visibility: Optional[str] = None,
    label_ids: Optional[List[str]] = None,
    assignee_filter: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "newest_first",
    page: int = 1,
    per_page: int = 20
) -> Dict[str, Any]:
    """Get paginated tasks visible to user with filters."""
    supabase = get_supabase()
    
    all_tasks_result = supabase.table("tasks").select(
        "*, created_by_user:users!created_by(id, name, email, avatar_url), "
        "assigned_to_user:users!assigned_to(id, name, email, avatar_url), "
        "task_labels(label_id, labels(id, name))"
    ).execute()
    
    all_tasks = all_tasks_result.data if all_tasks_result.data else []
    
    visible_tasks = [
        task for task in all_tasks
        if can_view_task(task, user_id)
    ]
    
    filtered_tasks = visible_tasks
    
    if status:
        filtered_tasks = [t for t in filtered_tasks if t["status"] in status]
    
    if priority:
        filtered_tasks = [t for t in filtered_tasks if t["priority"] in priority]
    
    if visibility:
        filtered_tasks = [t for t in filtered_tasks if t["visibility"] == visibility]
    
    if label_ids:
        filtered_tasks = [
            t for t in filtered_tasks
            if any(
                tl["labels"]["id"] in label_ids
                for tl in t.get("task_labels", [])
                if tl.get("labels")
            )
        ]
    
    if assignee_filter == "assigned_to_me":
        filtered_tasks = [t for t in filtered_tasks if t.get("assigned_to") == user_id]
    elif assignee_filter == "created_by_me":
        filtered_tasks = [t for t in filtered_tasks if t["created_by"] == user_id]
    elif assignee_filter == "unassigned":
        filtered_tasks = [t for t in filtered_tasks if t.get("assigned_to") is None]
    
    if search:
        search_lower = search.lower()
        filtered_tasks = [
            t for t in filtered_tasks
            if search_lower in t["title"].lower() or
               (t.get("description") and search_lower in t["description"].lower())
        ]
    
    priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    
    if sort == "oldest_first":
        filtered_tasks.sort(key=lambda t: t["created_at"])
    elif sort == "priority_high_to_low":
        filtered_tasks.sort(key=lambda t: priority_order.get(t["priority"], 0), reverse=True)
    elif sort == "priority_low_to_high":
        filtered_tasks.sort(key=lambda t: priority_order.get(t["priority"], 0))
    else:
        filtered_tasks.sort(key=lambda t: t["created_at"], reverse=True)
    
    total_count = len(filtered_tasks)
    total_pages = max(1, (total_count + per_page - 1) // per_page)
    
    offset = (page - 1) * per_page
    paginated_tasks = filtered_tasks[offset:offset + per_page]
    
    return {
        "tasks": [format_task(t) for t in paginated_tasks],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_count": total_count,
            "total_pages": total_pages
        }
    }


def get_task_by_id(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Get single task by ID if user has visibility."""
    supabase = get_supabase()
    
    result = supabase.table("tasks").select(
        "*, created_by_user:users!created_by(id, name, email, avatar_url), "
        "assigned_to_user:users!assigned_to(id, name, email, avatar_url), "
        "task_labels(labels(id, name))"
    ).eq("id", task_id).execute()
    
    if not result.data:
        return None
    
    task = result.data[0]
    
    if not can_view_task(task, user_id):
        return None
    
    return format_task(task)


def update_task(
    task_id: str,
    user_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    visibility: Optional[str] = None,
    assigned_to: Optional[str] = None,
    label_ids: Optional[List[str]] = None
) -> Optional[Dict[str, Any]]:
    """Update task details (creator only, not if completed)."""
    supabase = get_supabase()
    
    task = get_task_by_id(task_id, user_id)
    if not task:
        return None
    
    if task["created_by"]["id"] != user_id:
        return None
    
    if task["status"] == "completed":
        return None
    
    updates = {}
    
    if title is not None:
        updates["title"] = title.strip()[:200]
    
    if description is not None:
        updates["description"] = description.strip()[:10000] if description else None
    
    if priority is not None:
        updates["priority"] = priority
    
    if visibility is not None:
        updates["visibility"] = visibility
    
    if assigned_to is not None:
        updates["assigned_to"] = assigned_to
    
    if updates:
        supabase.table("tasks").update(updates).eq("id", task_id).execute()
    
    if label_ids is not None:
        from services.labels_service import validate_label_ids
        label_ids = validate_label_ids(label_ids)
        
        supabase.table("task_labels").delete().eq("task_id", task_id).execute()
        
        if label_ids:
            label_associations = [
                {"task_id": task_id, "label_id": label_id}
                for label_id in label_ids
            ]
            supabase.table("task_labels").insert(label_associations).execute()
    
    return get_task_by_id(task_id, user_id)


def can_view_task(task: Dict[str, Any], user_id: str) -> bool:
    """Check if user can view task based on visibility rules."""
    if task["visibility"] == "public":
        return True
    
    if task["created_by"] == user_id:
        return True
    
    if task["assigned_to"] == user_id:
        return True
    
    return False


def get_task_history(task_id: str, user_id: str):
    task = get_task_by_id(task_id, user_id)
    if not task:
        return None

    supabase = get_supabase()
    result = (
        supabase.table("task_history")
        .select("*, user:users(id, name, email, avatar_url)")
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data if result.data else []


def format_task(task: Dict[str, Any]) -> Dict[str, Any]:
    """Format task with proper label structure."""
    labels = []
    for task_label in task.get("task_labels", []):
        if "labels" in task_label and task_label["labels"]:
            labels.append({
                "id": task_label["labels"]["id"],
                "name": task_label["labels"]["name"]
            })
    
    return {
        "id": task["id"],
        "title": task["title"],
        "description": task.get("description"),
        "status": task["status"],
        "priority": task["priority"],
        "visibility": task["visibility"],
        "created_by": task.get("created_by_user"),
        "assigned_to": task.get("assigned_to_user"),
        "labels": labels,
        "created_at": task["created_at"],
        "completed_at": task.get("completed_at")
    }
