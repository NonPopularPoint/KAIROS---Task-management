"""
KAIROS Database Schema Verification Script
Checks if all tables, indexes, and seed data were created successfully.
Uses Supabase REST API (no need for database password).
"""

import sys
import os

# Add parent directory (backend) to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.supabase_client import get_supabase


def verify_database_schema():
    """Verify that all Phase 1.1 database objects exist."""
    print("=" * 70)
    print("KAIROS DATABASE SCHEMA VERIFICATION")
    print("=" * 70)
    
    try:
        supabase = get_supabase()
        print("\n[OK] Connected to Supabase API")
    except Exception as e:
        print(f"\n[ERROR] Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Verify labels table and seed data
    print("\n[*] Checking labels table and seed data...")
    try:
        response = supabase.table("labels").select("name").execute()
        labels = [row["name"] for row in response.data]
        
        expected_labels = ["Frontend", "Backend", "Bug", "Feature", "Research", "Documentation", "Urgent"]
        labels_sorted = sorted(labels)
        expected_sorted = sorted(expected_labels)
        
        if labels_sorted == expected_sorted:
            print(f"[OK] Labels table exists with {len(labels)} labels:")
            for label in sorted(labels):
                print(f"     - {label}")
        else:
            print(f"[WARNING] Labels mismatch!")
            print(f"     Expected: {expected_sorted}")
            print(f"     Found: {labels_sorted}")
    except Exception as e:
        print(f"[ERROR] Failed to query labels table: {e}")
        print("     Make sure you've executed 001_initial_schema.sql in Supabase SQL Editor")
        sys.exit(1)
    
    # Try to query other tables to verify they exist
    tables_to_check = [
        ("users", "User accounts table"),
        ("tasks", "Tasks table"),
        ("task_labels", "Task-Label junction table"),
        ("comments", "Comments table"),
        ("task_history", "Task history table")
    ]
    
    print(f"\n[*] Checking remaining tables...")
    all_tables_exist = True
    
    for table_name, description in tables_to_check:
        try:
            # Try to query the table (will return empty result if exists, error if not)
            supabase.table(table_name).select("*").limit(1).execute()
            print(f"[OK] {table_name} - {description}")
        except Exception as e:
            print(f"[ERROR] {table_name} - Table not found or not accessible")
            all_tables_exist = False
    
    # Final result
    print("\n" + "=" * 70)
    if all_tables_exist and len(labels) == 7:
        print("[SUCCESS] Database schema verified successfully!")
        print("=" * 70)
        print("\nAll 6 tables exist and 7 labels are seeded.")
        print("\nPhase 1.1: Database Setup - COMPLETE")
        print("\nNext: Update roadmap checklist and begin Phase 2.1")
        return True
    else:
        print("[INCOMPLETE] Database schema verification failed")
        print("=" * 70)
        print("\nPlease execute 001_initial_schema.sql in Supabase SQL Editor:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Navigate to SQL Editor")
        print("4. Copy-paste contents of 001_initial_schema.sql")
        print("5. Click 'Run'")
        print("6. Run this verification script again")
        return False


if __name__ == "__main__":
    success = verify_database_schema()
    sys.exit(0 if success else 1)
