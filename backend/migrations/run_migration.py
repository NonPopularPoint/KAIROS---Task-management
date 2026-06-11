"""
KAIROS Database Migration Runner
Executes SQL migrations against Supabase PostgreSQL database.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def get_db_connection_string():
    """Extract PostgreSQL connection details from Supabase URL."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    
    # Parse Supabase URL: https://PROJECT_ID.supabase.co
    parsed = urlparse(SUPABASE_URL)
    project_id = parsed.hostname.split('.')[0]
    
    # Supabase PostgreSQL connection details
    db_host = f"db.{project_id}.supabase.co"
    db_port = "5432"
    db_name = "postgres"
    db_user = "postgres"
    db_password = SUPABASE_KEY
    
    return {
        "host": db_host,
        "port": db_port,
        "database": db_name,
        "user": db_user,
        "password": db_password
    }


def execute_sql_file(filepath):
    """Execute a SQL migration file."""
    print("=" * 70)
    print("KAIROS DATABASE MIGRATION RUNNER")
    print("=" * 70)
    
    # Read SQL file
    print(f"\n[*] Reading migration file: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql = f.read()
        print(f"[OK] Loaded {len(sql)} characters of SQL")
    except FileNotFoundError:
        print(f"[ERROR] Migration file not found: {filepath}")
        sys.exit(1)
    
    # Get connection details
    print("\n[*] Connecting to Supabase PostgreSQL...")
    try:
        conn_params = get_db_connection_string()
        print(f"    Host: {conn_params['host']}")
        print(f"    Database: {conn_params['database']}")
        print(f"    User: {conn_params['user']}")
    except ValueError as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    
    # Connect to database
    try:
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cursor = conn.cursor()
        print("[OK] Connected successfully")
    except psycopg2.Error as e:
        print(f"[ERROR] Failed to connect to database:")
        print(f"    {e}")
        sys.exit(1)
    
    # Execute migration
    print("\n[*] Executing migration...")
    try:
        cursor.execute(sql)
        print("[OK] Migration executed successfully")
    except psycopg2.Error as e:
        print(f"[ERROR] Migration failed:")
        print(f"    {e}")
        conn.close()
        sys.exit(1)
    
    # Verify tables created
    print("\n[*] Verifying migration results...")
    
    # Check tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
            AND table_name IN ('users', 'tasks', 'labels', 'task_labels', 'comments', 'task_history')
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print(f"\n   Tables created: {len(tables)}/6")
    for table in tables:
        print(f"      ✓ {table[0]}")
    
    # Check indexes
    cursor.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
        ORDER BY indexname;
    """)
    indexes = cursor.fetchall()
    print(f"\n   Indexes created: {len(indexes)}/7")
    for index in indexes:
        print(f"      ✓ {index[0]}")
    
    # Check labels
    cursor.execute("SELECT name FROM labels ORDER BY name;")
    labels = cursor.fetchall()
    print(f"\n   Labels seeded: {len(labels)}/7")
    for label in labels:
        print(f"      ✓ {label[0]}")
    
    # Check constraints
    cursor.execute("""
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid IN (
            SELECT oid FROM pg_class WHERE relname IN ('tasks', 'task_labels', 'comments', 'task_history')
        )
        AND contype IN ('c', 'f')
        ORDER BY conname;
    """)
    constraints = cursor.fetchall()
    print(f"\n   Constraints created: {len(constraints)}")
    
    # Close connection
    cursor.close()
    conn.close()
    
    # Final summary
    print("\n" + "=" * 70)
    print("[SUCCESS] MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 70)
    print("\nDatabase schema is ready for Phase 2: Authentication System")
    print("\nNext steps:")
    print("  1. Verify tables in Supabase Dashboard → Table Editor")
    print("  2. Update roadmap checklist (Phase 1.1 complete)")
    print("  3. Begin Phase 2.1: Backend — Google OAuth")
    

if __name__ == "__main__":
    migration_file = os.path.join(
        os.path.dirname(__file__),
        "001_initial_schema.sql"
    )
    execute_sql_file(migration_file)
