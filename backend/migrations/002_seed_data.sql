-- ============================================
-- KAIROS — Seed Data for Internship Submission
-- ============================================
-- Run this AFTER 001_initial_schema.sql
-- Idempotent: safe to re-run
-- ============================================

-- ============================================
-- 1. DEMO USERS
-- ============================================
INSERT INTO users (google_id, name, email, avatar_url) VALUES
    ('google-ajay', 'Ajaysinh Jadeja', 'ubajaysinh9178108@gmail.com', NULL),
    ('google-dharati', 'Dharati K', 'dharatik1239@gmail.com', NULL),
    ('google-kuldip', 'Jadeja Kuldipsinh', 'kuldipsinhjadeja478@gmail.com', NULL),
    ('google-kuldip2', 'Kuldipsinh Jadeja', 'saymynamejk0@gmail.com', NULL)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- ============================================
-- 2. TASKS
-- ============================================

-- Task 1: Completed — Full workflow
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at, completed_at)
SELECT 'Redesign login page UI', 'Update the login page with the new brand colors. Includes logo placement, Google sign-in button styling, and responsive layout for mobile devices.', 'completed', 'high', 'public', u1.id, u2.id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'ubajaysinh9178108@gmail.com';

-- Task 2: In Progress
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Implement task filtering by labels', 'Add multi-select label filter to the task list page. Users should be able to filter tasks by one or more labels. Active filters show as dismissible chips.', 'in_progress', 'medium', 'public', u1.id, u2.id, NOW() - INTERVAL '3 days'
FROM users u1, users u2 WHERE u1.email = 'ubajaysinh9178108@gmail.com' AND u2.email = 'dharatik1239@gmail.com';

-- Task 3: Ready For Review
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Write API documentation for tasks endpoints', 'Document all task-related API endpoints including CRUD, status transitions, assignment, and filtering. Include request/response examples.', 'ready_for_review', 'low', 'public', u1.id, u2.id, NOW() - INTERVAL '5 days'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'ubajaysinh9178108@gmail.com';

-- Task 4: Pending
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated testing and deployment. Frontend should deploy to Vercel staging on PR merge.', 'pending', 'critical', 'private', u1.id, u2.id, NOW() - INTERVAL '1 day'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'dharatik1239@gmail.com';

-- Task 5: Public unassigned (claimable)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Research performance optimization', 'Investigate page load times and identify bottlenecks. Check API response times, image optimization, and bundle size.', 'pending', 'medium', 'public', u1.id, NULL, NOW() - INTERVAL '2 days'
FROM users u1 WHERE u1.email = 'ubajaysinh9178108@gmail.com';

-- Task 6: Cancelled
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Add dark mode support', 'Implement dark mode toggle across all pages. Use CSS variables for theme switching.', 'cancelled', 'low', 'private', u1.id, u2.id, NOW() - INTERVAL '10 days'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'saymynamejk0@gmail.com';

-- Task 7: In Progress unassigned (needs assignee badge)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, created_at)
SELECT 'Fix mobile navigation hamburger menu', 'The hamburger menu on mobile devices is not closing when clicking outside. Add click-outside listener.', 'in_progress', 'high', 'public', u1.id, NOW() - INTERVAL '4 days'
FROM users u1 WHERE u1.email = 'dharatik1239@gmail.com';

-- Task 8: Completed
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at, completed_at)
SELECT 'Update dependencies to latest versions', 'Upgrade all npm and pip packages to their latest stable versions. Test for breaking changes.', 'completed', 'medium', 'private', u1.id, u2.id, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'
FROM users u1, users u2 WHERE u1.email = 'saymynamejk0@gmail.com' AND u2.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 9: Self-assigned pending
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Create user onboarding flow', 'Design a simple onboarding flow for first-time users. Should include tooltips for key features.', 'pending', 'medium', 'public', u1.id, u1.id, NOW() - INTERVAL '12 hours'
FROM users u1 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 10: WebSockets (in progress)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Implement real-time collaboration with WebSockets', 'Add WebSocket support using Socket.IO. Join rooms per task ID. Emit events for task updates, comments, and status changes. Handle reconnection gracefully.', 'in_progress', 'high', 'private', u1.id, u2.id, NOW() - INTERVAL '2 days'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'saymynamejk0@gmail.com';

-- Task 11: CSV export (ready for review)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Add export to CSV functionality', 'Create backend endpoint GET /api/tasks/export?format=csv with filter support. Stream CSV with proper headers. Add download button on frontend task list.', 'ready_for_review', 'medium', 'public', u1.id, u2.id, NOW() - INTERVAL '4 days'
FROM users u1, users u2 WHERE u1.email = 'ubajaysinh9178108@gmail.com' AND u2.email = 'dharatik1239@gmail.com';

-- Task 12: Session timeout fix (critical)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, assigned_to, created_at)
SELECT 'Fix session timeout causing data loss', 'Users lose work when JWT expires during long editing sessions. Implement localStorage draft saving, token refresh mechanism, and warning modal before expiry.', 'pending', 'critical', 'private', u1.id, u2.id, NOW() - INTERVAL '1 day'
FROM users u1, users u2 WHERE u1.email = 'kuldipsinhjadeja478@gmail.com' AND u2.email = 'ubajaysinh9178108@gmail.com';

-- Task 13: Email templates (public unassigned)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, created_at)
SELECT 'Design email notification templates', 'Create HTML email templates for all 8 notification types. Use KAIROS brand colors (indigo #6366F1, beige #F5F0EB). Include CTA button, task details table. Test in Gmail, Outlook, Apple Mail.', 'pending', 'low', 'public', u1.id, NOW() - INTERVAL '3 days'
FROM users u1 WHERE u1.email = 'dharatik1239@gmail.com';

-- Task 14: Performance refactor (unassigned in progress)
INSERT INTO tasks (title, description, status, priority, visibility, created_by, created_at)
SELECT 'Refactor task filtering logic for performance', 'Push filtering from Python in-memory to SQL level. Use Supabase query builder with proper WHERE clauses. Benchmarks: compare 100, 500, 1000, 5000 tasks.', 'in_progress', 'medium', 'public', u1.id, NOW() - INTERVAL '2 days'
FROM users u1 WHERE u1.email = 'ubajaysinh9178108@gmail.com';

-- ============================================
-- 3. TASK LABELS
-- ============================================
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Redesign login page UI' AND l.name IN ('Frontend', 'Bug');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Implement task filtering by labels' AND l.name IN ('Frontend', 'Feature');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Write API documentation for tasks endpoints' AND l.name IN ('Documentation');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Set up CI/CD pipeline' AND l.name IN ('Backend', 'Urgent');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Research performance optimization' AND l.name IN ('Research');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Fix mobile navigation hamburger menu' AND l.name IN ('Frontend', 'Bug');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Implement real-time collaboration with WebSockets' AND l.name IN ('Backend', 'Feature', 'Urgent');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Add export to CSV functionality' AND l.name IN ('Backend', 'Feature');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Fix session timeout causing data loss' AND l.name IN ('Backend', 'Bug', 'Urgent');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Design email notification templates' AND l.name IN ('Frontend', 'Documentation');
INSERT INTO task_labels (task_id, label_id) SELECT t.id, l.id FROM tasks t, labels l WHERE t.title = 'Refactor task filtering logic for performance' AND l.name IN ('Backend', 'Research');

-- ============================================
-- 4. COMMENTS
-- ============================================
-- Task 1: Redesign login page
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Updated the login page with new brand colors. Logo centered, Google button restyled, fully responsive.', t.completed_at - INTERVAL '2 hours'
FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'ubajaysinh9178108@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Mobile version needs polish. Form padding too large under 360px. Please reduce slightly.', t.completed_at - INTERVAL '1 hour'
FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'kuldipsinhjadeja478@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Fixed padding issue. Looks clean on all screen sizes now.', t.completed_at - INTERVAL '30 minutes'
FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'ubajaysinh9178108@gmail.com';

-- Task 3: API docs
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'All task endpoints documented with examples in the /docs folder.', NOW() - INTERVAL '4 hours'
FROM tasks t, users u WHERE t.title = 'Write API documentation for tasks endpoints' AND u.email = 'ubajaysinh9178108@gmail.com';

-- Task 10: WebSocket
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Initial research done. Socket.IO is the right choice. Basic connection handler set up in feature/websocket branch.', NOW() - INTERVAL '2 days' + INTERVAL '3 hours'
FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'saymynamejk0@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'For auth, reuse existing JWT middleware — validate token on WebSocket handshake.', NOW() - INTERVAL '2 days' + INTERVAL '5 hours'
FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'kuldipsinhjadeja478@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Prototype pushed. Connection and room joining work. Working on event emission now.', NOW() - INTERVAL '1 day'
FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'saymynamejk0@gmail.com';

-- Task 11: CSV export
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'CSV export endpoint ready. All filters tested. Streaming works — under 2s for 10k tasks.', NOW() - INTERVAL '6 hours'
FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'dharatik1239@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Missing labels column in CSV. Also add date to filename like tasks-export-2026-06-11.csv.', NOW() - INTERVAL '4 hours'
FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'ubajaysinh9178108@gmail.com';

-- Task 12: Session timeout
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Urgent: affecting users daily. Implement localStorage draft first as quick fix, add token refresh later.', NOW() - INTERVAL '12 hours'
FROM tasks t, users u WHERE t.title = 'Fix session timeout causing data loss' AND u.email = 'ubajaysinh9178108@gmail.com';

INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Agreed. You do drafts, I will work on token refresh in parallel.', NOW() - INTERVAL '10 hours'
FROM tasks t, users u WHERE t.title = 'Fix session timeout causing data loss' AND u.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 14: Performance
INSERT INTO comments (task_id, user_id, message, created_at)
SELECT t.id, u.id, 'Benchmarks: 500 tasks = 45ms in-memory, 5000 tasks = 380ms. SQL approach targets under 50ms for 5000.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'
FROM tasks t, users u WHERE t.title = 'Refactor task filtering logic for performance' AND u.email = 'ubajaysinh9178108@gmail.com';

-- ============================================
-- 5. TASK HISTORY
-- ============================================
-- Task 1: Full lifecycle
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'ubajaysinh9178108@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '1 hour' FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'status_changed', u.id, '{"old_status": "pending", "new_status": "in_progress"}', t.created_at + INTERVAL '2 days' FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'ubajaysinh9178108@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_submitted_for_review', u.id, '{"old_status": "in_progress", "new_status": "ready_for_review"}', t.created_at + INTERVAL '5 days' FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'ubajaysinh9178108@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'review_changes_requested', u.id, '{"old_status": "ready_for_review", "new_status": "in_progress", "feedback": "Mobile padding needs adjustment"}', t.created_at + INTERVAL '6 days' FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_approved_completed', u.id, '{"old_status": "ready_for_review", "new_status": "completed"}', t.completed_at FROM tasks t, users u WHERE t.title = 'Redesign login page UI' AND u.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 4: CI/CD
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Set up CI/CD pipeline' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'dharatik1239@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '30 minutes' FROM tasks t, users u WHERE t.title = 'Set up CI/CD pipeline' AND u.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 6: Cancelled
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Add dark mode support' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'saymynamejk0@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '1 hour' FROM tasks t, users u WHERE t.title = 'Add dark mode support' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_cancelled', u.id, '{"old_status": "pending", "new_status": "cancelled", "reason": "Deferred to next sprint"}', t.created_at + INTERVAL '2 days' FROM tasks t, users u WHERE t.title = 'Add dark mode support' AND u.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 10: WebSocket
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'saymynamejk0@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '1 hour' FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'status_changed', u.id, '{"old_status": "pending", "new_status": "in_progress"}', t.created_at + INTERVAL '6 hours' FROM tasks t, users u WHERE t.title = 'Implement real-time collaboration with WebSockets' AND u.email = 'saymynamejk0@gmail.com';

-- Task 11: CSV
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'ubajaysinh9178108@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'dharatik1239@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '2 hours' FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'ubajaysinh9178108@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'status_changed', u.id, '{"old_status": "pending", "new_status": "in_progress"}', t.created_at + INTERVAL '1 day' FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'dharatik1239@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_submitted_for_review', u.id, '{"old_status": "in_progress", "new_status": "ready_for_review"}', t.created_at + INTERVAL '3 days' FROM tasks t, users u WHERE t.title = 'Add export to CSV functionality' AND u.email = 'dharatik1239@gmail.com';

-- Task 12: Session
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Fix session timeout causing data loss' AND u.email = 'kuldipsinhjadeja478@gmail.com';
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_assigned', u.id, jsonb_build_object('assignee_id', (SELECT id::text FROM users WHERE email = 'ubajaysinh9178108@gmail.com'), 'self_assigned', false), t.created_at + INTERVAL '30 minutes' FROM tasks t, users u WHERE t.title = 'Fix session timeout causing data loss' AND u.email = 'kuldipsinhjadeja478@gmail.com';

-- Task 13: Email (unassigned)
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Design email notification templates' AND u.email = 'dharatik1239@gmail.com';

-- Task 14: Performance (unassigned)
INSERT INTO task_history (task_id, event_type, user_id, details, created_at)
SELECT t.id, 'task_created', u.id, NULL, t.created_at FROM tasks t, users u WHERE t.title = 'Refactor task filtering logic for performance' AND u.email = 'ubajaysinh9178108@gmail.com';

-- ============================================
-- 6. VERIFICATION
-- ============================================
SELECT 'Users:' AS info, COUNT(*) AS count FROM users;
SELECT 'Tasks:' AS info, COUNT(*) AS count FROM tasks;
SELECT 'Labels:' AS info, COUNT(*) AS count FROM labels;
SELECT 'Task Labels:' AS info, COUNT(*) AS count FROM task_labels;
SELECT 'Comments:' AS info, COUNT(*) AS count FROM comments;
SELECT 'History:' AS info, COUNT(*) AS count FROM task_history;
