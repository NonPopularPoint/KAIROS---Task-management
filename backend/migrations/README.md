"""
KAIROS Database Migration - Instructions
Phase 1.1: Initial Schema Setup

Since Supabase requires direct database credentials (not API keys) for psycopg2 connections,
the recommended approach is to execute the migration SQL directly in the Supabase Dashboard.

INSTRUCTIONS:
=============

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: obkretblhwhdmhpxvyvm
3. Navigate to: SQL Editor (left sidebar)
4. Click "New Query"
5. Copy the contents of '001_initial_schema.sql' and paste into the editor
6. Click "Run" to execute the migration
7. Check the results panel to verify all tables, indexes, and labels were created
8. Run the verification queries at the end of the SQL file to confirm

After successful execution, you should see:
- 6 tables created (users, tasks, labels, task_labels, comments, task_history)
- 7 indexes created
- 7 labels seeded (Frontend, Backend, Bug, Feature, Research, Documentation, Urgent)

ALTERNATIVE: Direct PostgreSQL Connection
==========================================

If you prefer to use this script with psycopg2, you need to:

1. In Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" (URI format)
3. Add to your .env file:
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

4. Update run_migration.py to use DATABASE_URL instead of parsing SUPABASE_URL

For now, please execute the SQL file manually in the Supabase Dashboard SQL Editor.
"""

print(__doc__)
