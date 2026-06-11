from typing import List
from utils.supabase_client import get_supabase


def get_all_labels() -> List[dict]:
    supabase = get_supabase()
    result = supabase.table("labels").select("*").order("name").execute()
    return result.data if result.data else []


def validate_label_ids(label_ids: List[str]) -> List[str]:
    if not label_ids:
        return []
    
    unique_ids = list(set(label_ids))
    supabase = get_supabase()
    result = supabase.table("labels").select("id").in_("id", unique_ids).execute()
    existing_ids = {r["id"] for r in (result.data or [])}
    
    invalid = [lid for lid in unique_ids if lid not in existing_ids]
    if invalid:
        raise ValueError(f"Invalid label IDs: {invalid}")
    
    return unique_ids
