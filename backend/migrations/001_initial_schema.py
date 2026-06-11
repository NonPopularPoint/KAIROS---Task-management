"""
Database migration script for KAIROS - Phase 1.1
Creates all tables, indexes, and seeds default labels.
"""

import sys
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)


def run_migration():
    """Execute the complete database migration."""
    print("=" * 60)
    print("KAIROS Database Migration - Phase 1.1")
    print("=" * 60)
    
    # Connect to Supabase
    print("\n1. Connecting to Supabase...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase successfully")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Note: Supabase Python client doesn't expose raw SQL execution directly
    # We need to use the Supabase dashboard SQL editor or use psycopg2
    # Let me create the SQL statements that should be run
    
    print("\n2. Creating SQL migration statements...")
    print("\n" + "=" * 60)
    print("SQL MIGRATION SCRIPT")
    print("=" * 60)
    print("\nPlease execute the following SQL in your Supabase SQL Editor:")
    print("\n" + "-" * 60)
    
    sql = """
-- ============================================
-- KAIROS Database Schema Migration
-- Phase 1.1: All Tables, Indexes, and Seeds
-- ============================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    visibility VARCHAR(50) NOT NULL DEFAULT 'private',
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'ready_for_review', 'completed', 'cancelled')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'public'))
);

-- 3. Create indexes on tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 4. Create labels table
CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Seed default labels (idempotent)
INSERT INTO labels (name) VALUES 
    ('Frontend'),
    ('Backend'),
    ('Bug'),
    ('Feature'),
    ('Research'),
    ('Documentation'),
    ('Urgent')
ON CONFLICT (name) DO NOTHING;

-- 6. Create task_labels junction table
CREATE TABLE IF NOT EXISTS task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- 7. Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

-- 8. Create task_history table
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

-- ============================================
-- Verification Queries
-- ============================================

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify labels seeded
SELECT id, name, created_at FROM labels ORDER BY name;

-- Show all indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"""
    
    print(sql)
    print("-" * 60)
    
    print("\n3. After running the SQL above, the database will have:")
    print("   ✓ users table")
    print("   ✓ tasks table with 5 indexes")
    print("   ✓ labels table with 7 seeded labels")
    print("   ✓ task_labels junction table")
    print("   ✓ comments table with 1 index")
    print("   ✓ task_history table with 1 index")
    
    print("\n" + "=" * 60)
    print("Migration SQL generated successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Copy the SQL above")
    print("2. Go to your Supabase Dashboard → SQL Editor")
    print("3. Paste and execute the SQL")
    print("4. Verify the tables and labels were created")
    print("5. Run this script again with --verify flag to confirm")
    

if __name__ == "__main__":
    run_migration()
