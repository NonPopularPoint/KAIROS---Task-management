# KAIROS — Task Management

A task management web application built as part of the Hairdrama Tech Internship assessment. Users authenticate via Google OAuth, create and assign tasks, track work through a review workflow, and receive email notifications for task lifecycle events.

**Live URL:** https://kairos-task-management-platfrom-pf9.vercel.app
**API:** https://kuldipsinhjadeja478.pythonanywhere.com/api

---

## Tech Stack

| Layer        | Technology            |
|-------------|----------------------|
| Frontend     | Next.js 16 + TypeScript |
| Backend      | Flask (Python)        |
| Database     | Supabase PostgreSQL   |
| Auth         | Google OAuth 2.0      |
| Email        | Gmail SMTP            |
| Styling      | Tailwind CSS          |
| Animations   | Framer Motion         |
| Charts       | Recharts              |
| Drag & Drop  | @dnd-kit              |
| Icons        | Lucide React          |

---

## Architecture

```
┌─────────────────────────┐
│  Vercel (Next.js)       │
│  - SSR pages            │
│  - Client components     │
└─────────┬───────────────┘
          │ HTTP / JSON
┌─────────▼───────────────┐
│  Render (Flask)          │
│  - REST API endpoints    │
│  - JWT auth middleware   │
│  - Email service         │
└─────────┬───────────────┘
          │ SQL queries
┌─────────▼───────────────┐
│  Supabase (PostgreSQL)   │
│  - users, tasks          │
│  - labels, comments      │
│  - task_history          │
└─────────────────────────┘
```

### Key Design Decisions

- **Single bounded context** — all domain logic (auth, tasks, notifications) lives in one Flask application
- **JWT with database lookup** — tokens contain only user ID; fresh user data fetched on each request for data consistency
- **Client-side filtering** — tasks fetched with visibility filter, then filtered/sorted/paginated in Python (appropriate for this scale)
- **Async email** — SMTP sends run in a daemon thread to avoid blocking API responses
- **No hard delete** — tasks are business records; cancellation is the only closure path

---

## Features

### Authentication
- Google OAuth sign-in
- JWT-based session management
- Protected routes (redirect to login)

### Tasks
- Create tasks with title, description, priority, labels, visibility
- Assign, reassign (with reason), unassign
- Claim public unassigned tasks
- Change visibility (private / public)

### Workflow
- 5 statuses: Pending → In Progress → Ready For Review → Completed
- Cancelled / Reopen
- Completion notes, review feedback, cancellation reasons stored as comments
- Completed tasks are terminal — cannot be modified

### Dashboard
- 9 metric cards with animated count-up
- Weekly task completion bar chart
- Recent activity timeline

### Task List
- Filters: status, priority, labels, visibility, assignee relationship
- Search (title + description, debounced)
- Sort: newest, oldest, priority
- Pagination with page numbers
- List / Board view toggle

### Kanban Board
- 4 columns with drag-and-drop
- Valid transition enforcement
- Completion note / review feedback modals on drop

### Task Detail
- Inline title editing
- Inline description editing with character counter
- Label editing
- Comments (CRUD) with creator moderation
- Task history timeline
- Workflow action buttons (role + status dependent)

### Email Notifications
- Task assigned / reassigned / unassigned
- Task claimed
- Ready For Review / Changes Requested
- Task approved / cancelled / reopened
- Self-suppression rules (no email when creator == assignee)

### Labels
- 7 seeded labels: Frontend, Backend, Bug, Feature, Research, Documentation, Urgent

---

## Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- Supabase account
- Google Cloud Console project

### 1. Clone

```bash
git clone https://github.com/your-repo/kairos-task-management.git
cd kairos-task-management
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key

SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

JWT_SECRET=your-jwt-secret
JWT_EXPIRATION_HOURS=24

SMTP_EMAIL=your-gmail
SMTP_PASSWORD=your-gmail-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Database Setup
- Go to Supabase Dashboard → SQL Editor
- Run `backend/migrations/001_initial_schema.sql`
- This creates all 6 tables and seeds 7 labels

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 5. Run

```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate
python app.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
├── backend/
│   ├── app.py                 # Flask application factory
│   ├── config.py              # Environment configuration
│   ├── requirements.txt       # Python dependencies
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database schema + seed data
│   ├── routes/
│   │   ├── auth.py            # Google OAuth, JWT endpoints
│   │   ├── users.py           # User list / detail
│   │   ├── tasks.py           # Task CRUD, status, assignment
│   │   ├── labels.py          # Labels list
│   │   ├── comments.py        # Comment CRUD
│   │   └── dashboard.py       # Metrics, weekly chart, activity
│   ├── services/
│   │   ├── auth_service.py    # Google token verification, user upsert
│   │   ├── task_service.py    # Task CRUD, visibility, history
│   │   ├── status_service.py  # Status transition validation
│   │   ├── assignment_service.py  # Assign, reassign, claim
│   │   ├── comment_service.py # Comment CRUD with permissions
│   │   ├── labels_service.py  # Label validation
│   │   ├── dashboard_service.py   # Metrics, chart data
│   │   ├── email_service.py   # SMTP sending, HTML templates
│   │   └── notifications.py   # Notification triggers + suppression
│   └── utils/
│       ├── jwt_utils.py       # JWT generation / verification
│       ├── decorators.py      # @require_auth decorator
│       └── supabase_client.py # Supabase singleton
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Redirect to login / dashboard
│   │   │   ├── layout.tsx         # Root layout with providers
│   │   │   ├── login/page.tsx     # Google OAuth login page
│   │   │   ├── dashboard/page.tsx # Dashboard with metrics + chart
│   │   │   ├── tasks/page.tsx     # Task list with filters
│   │   │   ├── tasks/[id]/page.tsx    # Task detail
│   │   │   ├── tasks/[id]/edit/page.tsx  # Edit task
│   │   │   ├── tasks/new/page.tsx   # Create task
│   │   │   ├── board/page.tsx      # Kanban board
│   │   │   └── profile/page.tsx    # User profile
│   │   ├── components/
│   │   │   ├── ui/               # 24 shared components (Button, Modal, etc.)
│   │   │   ├── Layout.tsx        # App layout shell
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── Header.tsx        # Top bar with avatar
│   │   │   ├── ProtectedRoute.tsx # Auth guard
│   │   │   ├── TaskFilters.tsx   # Filter bar
│   │   │   ├── TaskCard.tsx      # List view card
│   │   │   └── RecentActivity.tsx # Activity timeline
│   │   ├── hooks/               # 10 data hooks
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Auth state management
│   │   └── lib/
│   │       └── api.ts           # Fetch wrapper with JWT
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filtered, sorted, paginated) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Change status |
| PATCH | `/api/tasks/:id/assign` | Assign |
| PATCH | `/api/tasks/:id/reassign` | Reassign |
| PATCH | `/api/tasks/:id/unassign` | Unassign |
| PATCH | `/api/tasks/:id/claim` | Claim |
| PATCH | `/api/tasks/:id/visibility` | Change visibility |

### Comments, Labels, Dashboard, History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tasks/:id/comments` | List / create comments |
| PUT/DELETE | `/api/comments/:id` | Edit / delete comment |
| GET | `/api/labels` | List all labels |
| GET | `/api/dashboard/metrics` | Metric counts |
| GET | `/api/dashboard/recent-activity` | Activity feed |
| GET | `/api/dashboard/weekly-chart` | Weekly chart data |
| GET | `/api/tasks/:id/history` | Task history |

---

## Database Schema

6 tables: `users`, `tasks`, `labels`, `task_labels`, `comments`, `task_history`

Full schema in `backend/migrations/001_initial_schema.sql`

---

## Deployment

### Backend — Render
1. Create Web Service from GitHub repo
2. Root: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `gunicorn app:app`
5. Add env vars from `.env`
6. Use Starter plan ($7/mo) to prevent cold start

### Frontend — Vercel
1. Create Project from GitHub repo
2. Root: `frontend`
3. Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
4. Deploy

### Google OAuth
- Add frontend URL to Authorized JavaScript origins in Google Cloud Console

---

## Walkthrough Video

A loom video explaining the code and features will be recorded after deployment.
