from google.oauth2 import id_token
from google.auth.transport import requests
from config import Config
from utils.supabase_client import get_supabase


def verify_google_token(token: str) -> dict | None:
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            Config.GOOGLE_CLIENT_ID
        )
        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "avatar_url": idinfo.get("picture", "")
        }
    except (ValueError, Exception):
        return None


def upsert_user(google_id: str, email: str, name: str, avatar_url: str) -> dict | None:
    try:
        supabase = get_supabase()
        existing_user = supabase.table("users").select("*").eq("google_id", google_id).execute()
        
        if existing_user.data and len(existing_user.data) > 0:
            user = existing_user.data[0]
            updates = {}
            if user["name"] != name:
                updates["name"] = name
            if user["avatar_url"] != avatar_url:
                updates["avatar_url"] = avatar_url
            
            if updates:
                result = supabase.table("users").update(updates).eq("google_id", google_id).execute()
                return result.data[0] if result.data else None
            
            return user
        
        new_user = {
            "google_id": google_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url
        }
        result = supabase.table("users").insert(new_user).execute()
        return result.data[0] if result.data else None
    except Exception:
        return None


def get_user_by_id(user_id: str) -> dict | None:
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data and len(result.data) > 0 else None
    except Exception:
        return None
