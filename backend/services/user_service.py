from utils.supabase_client import get_supabase


def get_all_users() -> list[dict] | None:
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("*").order("name").execute()
        return result.data if result.data else []
    except Exception:
        return None


def get_user_by_id(user_id: str) -> dict | None:
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data and len(result.data) > 0 else None
    except Exception:
        return None
