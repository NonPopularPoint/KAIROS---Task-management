"""Supabase client singleton."""

from supabase import create_client, Client
from config import Config


_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the Supabase client singleton."""
    global _supabase
    if _supabase is None:
        _supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    return _supabase
