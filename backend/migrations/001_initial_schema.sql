-- ============================================
-- KAIROS Database Schema Migration
-- Phase 1.1: Initial Schema Setup
-- Version: 1.0
-- Date: 2026-06-08
-- ============================================

-- This migration creates all tables, indexes, and seeds default data
-- for the KAIROS task management application.

-- ============================================
-- 1. USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Authenticated users who have logged in via Google OAuth';
COMMENT ON COLUMN users.google_id IS 'Unique Google account identifier';
COMMENT ON COLUMN users.email IS 'User email from Google account';
COMMENT ON COLUMN users.avatar_url IS 'Google profile picture URL';


-- ============================================
-- 2. TASKS TABLE
-- ============================================

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

COMMENT ON TABLE tasks IS 'Work items created and assigned between users';
COMMENT ON COLUMN tasks.status IS 'Lifecycle state: pending, in_progress, ready_for_review, completed, cancelled';
COMMENT ON COLUMN tasks.priority IS 'Importance level: low, medium, high, critical';
COMMENT ON COLUMN tasks.visibility IS 'Access level: private (creator + assignee) or public (all users)';
COMMENT ON COLUMN tasks.created_by IS 'User who created the task (task creator)';
COMMENT ON COLUMN tasks.assigned_to IS 'User responsible for completing the task (assignee)';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task moved from ready_for_review to completed (terminal)';


-- ============================================
-- 3. TASKS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

COMMENT ON INDEX idx_tasks_created_by IS 'Filter tasks by creator';
COMMENT ON INDEX idx_tasks_assigned_to IS 'Filter tasks by assignee';
COMMENT ON INDEX idx_tasks_status IS 'Filter tasks by status';
COMMENT ON INDEX idx_tasks_visibility IS 'Filter tasks by visibility level';
COMMENT ON INDEX idx_tasks_priority IS 'Filter and sort tasks by priority';


-- ============================================
-- 4. LABELS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE labels IS 'Global categorization markers for tasks';
COMMENT ON COLUMN labels.name IS 'Label name (unique across system)';


-- ============================================
-- 5. SEED DEFAULT LABELS (IDEMPOTENT)
-- ============================================

INSERT INTO labels (name) VALUES 
    ('Frontend'),
    ('Backend'),
    ('Bug'),
    ('Feature'),
    ('Research'),
    ('Documentation'),
    ('Urgent')
ON CONFLICT (name) DO NOTHING;


-- ============================================
-- 6. TASK_LABELS JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

COMMENT ON TABLE task_labels IS 'Many-to-many relationship between tasks and labels';


-- ============================================
-- 7. COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    message VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

COMMENT ON TABLE comments IS 'User messages discussing tasks, including completion notes and review feedback';
COMMENT ON COLUMN comments.message IS 'Comment text, max 2000 characters';
COMMENT ON COLUMN comments.updated_at IS 'Timestamp of last edit (null if never edited)';
COMMENT ON INDEX idx_comments_task_id IS 'Fetch all comments for a task';


-- ============================================
-- 8. TASK_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);

COMMENT ON TABLE task_history IS 'Audit log of major task lifecycle events';
COMMENT ON COLUMN task_history.event_type IS 'Event: task_created, task_assigned, status_changed, etc.';
COMMENT ON COLUMN task_history.details IS 'JSON blob with event-specific data (old/new values, reasons, etc.)';
COMMENT ON INDEX idx_task_history_task_id IS 'Fetch timeline for a task';


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count tables created
SELECT 
    'Tables Created' AS check_type,
    COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'tasks', 'labels', 'task_labels', 'comments', 'task_history');

-- Count indexes created
SELECT 
    'Indexes Created' AS check_type,
    COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

-- Count labels seeded
SELECT 
    'Labels Seeded' AS check_type,
    COUNT(*) AS count
FROM labels;

-- List all labels
SELECT id, name, created_at FROM labels ORDER BY name;
