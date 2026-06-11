# KAIROS Database Setup - Phase 1.1

## Status: Ready to Execute

All migration files have been created. The SQL schema is ready but needs to be executed in Supabase.

---

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project: `obkretblhwhdmhpxvyvm`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute Migration SQL

1. Open the file: `backend/migrations/001_initial_schema.sql`
2. **Copy the entire contents** (6997 characters)
3. **Paste** into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Success

The query should complete successfully with output showing:
- Tables Created: 6
- Indexes Created: 7
- Labels Seeded: 7
- List of all 7 labels

**OR** run the verification script from your terminal:

```bash
cd backend/migrations
../venv/Scripts/python.exe verify_schema.py
```

You should see:
```
[SUCCESS] Database schema verified successfully!
Phase 1.1: Database Setup - COMPLETE
```

---

## What Was Created

### 6 Database Tables:

1. **users** - Authenticated users via Google OAuth
   - Columns: id, google_id, name, email, avatar_url, created_at
   - Constraints: unique google_id, unique email

2. **tasks** - Work items with status workflow
   - Columns: id, title, description, status, priority, visibility, created_by, assigned_to, created_at, completed_at
   - Constraints: CHECK constraints for status/priority/visibility enums
   - Foreign keys: created_by → users, assigned_to → users

3. **labels** - Global categorization markers
   - Columns: id, name, created_at
   - Constraints: unique name
   - **Seeded with 7 default labels**

4. **task_labels** - Many-to-many junction table
   - Columns: task_id, label_id
   - Constraints: composite primary key, foreign keys with CASCADE delete

5. **comments** - User messages on tasks
   - Columns: id, task_id, user_id, message, created_at, updated_at
   - Constraints: foreign keys to tasks and users with CASCADE delete

6. **task_history** - Audit log of major events
   - Columns: id, task_id, event_type, user_id, details (JSONB), created_at
   - Constraints: foreign keys with CASCADE delete

### 7 Indexes Created:

- `idx_tasks_created_by` - Filter by task creator
- `idx_tasks_assigned_to` - Filter by assignee
- `idx_tasks_status` - Filter by status
- `idx_tasks_visibility` - Filter by visibility
- `idx_tasks_priority` - Filter/sort by priority
- `idx_comments_task_id` - Fetch comments for a task
- `idx_task_history_task_id` - Fetch history timeline

### 7 Labels Seeded:

1. Frontend
2. Backend
3. Bug
4. Feature
5. Research
6. Documentation
7. Urgent

**Note:** The seed operation is idempotent - running the migration multiple times won't create duplicates.

---

## Files Created

```
backend/migrations/
├── 001_initial_schema.sql       # Complete migration SQL (execute this)
├── run_migration.py             # Python runner (requires database password)
├── verify_schema.py             # Verification script (uses Supabase API)
└── README.md                    # Setup instructions
```

---

## Troubleshooting

### Error: "relation does not exist"
→ The migration hasn't been executed yet. Follow Step 1-2 above.

### Error: "permission denied"
→ Make sure you're using the correct Supabase project.

### Error: "duplicate key value violates unique constraint"
→ Tables already exist. The migration is idempotent - it's safe to run again.

### Want to use psycopg2 instead?
You need the PostgreSQL connection string (not the API key):
1. Supabase Dashboard → Project Settings → Database
2. Copy "Connection string" (Direct connection)
3. Update `run_migration.py` to use that connection string

---

## Next Steps After Verification

Once you see `[SUCCESS]` from the verification script:

1. ✅ Mark Phase 1.1 complete in `KAIROS-Implementation-Roadmap.md`
2. ✅ Commit the migration files to git
3. ✅ Begin Phase 2.1: Backend — Google OAuth

---

## Production Notes

- All tables use UUID primary keys for scalability
- Foreign keys have CASCADE DELETE for referential integrity
- CHECK constraints enforce valid enum values at database level
- Indexes optimize common query patterns (filters, joins)
- Comments on tables/columns document the schema
- Seed data uses `ON CONFLICT DO NOTHING` for idempotency
