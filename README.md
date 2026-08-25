# PathToSkill

**Learn from paths that worked.**

## Problem Statement

Most EdTech platforms answer "what do I want to learn?" by showing you hundreds of courses ranked by
popularity or rating. That's overwhelming, and it ignores the one thing that actually predicts whether
a learning plan will work: **whether someone with a similar starting point already followed it successfully.**

## Solution

PathToSkill reframes course discovery around **learning journeys** instead of individual courses. Instead of
recommending courses in isolation, it shows learners the exact sequence of courses, practice, and projects
that another learner — starting from a similar skill level — followed to reach a specific goal. The platform
then lets you **follow that journey**, turning it into your own personalized, trackable learning path.

The product deliberately keeps peer identity out of the picture. Journeys are attributed to a generic
`Learner Journey #0N` label, never a real profile — the differentiator is the path, not the person.

## Core Idea

```
Goal + Starting Point
        ↓
Learners with Similar Starting Points
        ↓
Successful Learning Journey
        ↓
Recommended Learning Path
        ↓
Courses + Practice + Projects
        ↓
Progress + Outcome
```

## Key Features

- **Goal + starting-point onboarding** — goal, current level, existing skills, and learning style preference
- **Learning Journeys** — 5 seeded, fully worked journeys (Full-Stack, AI/ML, Product Design, Data Analytics,
  Digital Marketing) each with a visual, phase-grouped timeline
- **Follow a journey** — turns a journey into "My Learning Path" with ordered, trackable steps
- **Course discovery** — search, category/skill/difficulty/duration/rating filters, sorting
- **Course details** — curriculum, instructor, reviews, related courses, and a "why recommended" explanation
- **Lesson player** — content, resources, an inline knowledge check, completion tracking, next-lesson flow
- **Projects** — start/complete tracking tied into a learner's active path
- **Skill assessments** — scored quizzes that persist a result and an inferred skill level
- **Progress dashboard** — courses/projects completed, skills gained, learning hours, streak, next milestone
- **Notifications** — course/project completion, milestones, assessment results, journey recommendations
- **Global search** — categorized results across courses, journeys, projects, skills, and instructors
- **Authentication** — signup/login/logout, bcrypt hashing, JWT sessions, secure forgot/reset password flow

## Tech Stack

| Layer      | Technology                                  |
|------------|----------------------------------------------|
| Frontend   | React 18, Vite, React Router, Tailwind CSS 4  |
| Backend    | Node.js, Express                              |
| Database   | PostgreSQL (raw SQL via `pg`, no ORM)         |
| Auth       | bcrypt password hashing, JWT sessions         |

## Architecture

```
frontend/                React + Vite SPA
  src/
    api/                 fetch-based service layer (one client + grouped endpoint modules)
    components/          reusable UI (cards, forms, nav, modal, timeline, skeletons)
    context/             AuthContext (persistent JWT session), NotificationsContext
    layouts/             RootLayout (nav+footer), AuthLayout (centered auth card)
    pages/                one file per route
    hooks/                useDebounce, useOnClickOutside

backend/                 Express API
  src/
    config/db.js          pg Pool + query() helper — the only place that talks to Postgres directly
    routes/               one router per resource; queries live in the route handlers
    middleware/           requireAuth / optionalAuth (JWT), centralized error handler
    utils/                jwt, bcrypt-backed validators, reset-token hashing, asyncHandler
  db/
    migrations/001_init.sql   full schema (tables, FKs, indexes, constraints)
    migrate.js                 tracked, idempotent migration runner
    seed.js                    seed orchestration (truncates + reseeds)
    seeds/data.js               all seed content (goals, skills, courses, journeys, assessments)
    seeds/lessonTemplates.js    generates a 5-lesson curriculum per course
  public/                 (deploy-time only) receives the built frontend for the combined-service deploy;
                           git-ignored, not present in local dev where Vite serves the frontend separately
```

The frontend never talks to Postgres directly and never uses `localStorage` for application data — only the
JWT session token is kept client-side for persistent login. Every other piece of state (progress, journeys,
enrollments, notifications, reviews, assessment results) is read from and written to PostgreSQL through the API.

## Database Structure

Core tables (see `backend/db/migrations/001_init.sql` for full DDL):

- **Identity & goals**: `users`, `goals`, `skills`, `user_skills`, `password_reset_tokens`
- **Courses**: `instructors`, `courses`, `course_skills`, `lessons`, `enrollments`, `lesson_progress`, `reviews`
- **Projects**: `projects`, `project_skills`, `project_related_courses`, `user_projects`
- **Learning journeys** (the core differentiator): `learning_journeys`, `journey_starting_skills`,
  `journey_skills_gained`, `journey_steps` (the visual timeline), `journey_courses`, `journey_projects`,
  `saved_journeys`, `user_journeys` (a learner's active/completed journey)
- **Assessments**: `assessments`, `assessment_questions`, `assessment_results`
- **Engagement**: `notifications`

All tables use serial primary keys, foreign keys with appropriate `ON DELETE` behavior, `NOT NULL` and `CHECK`
constraints for enums (level, difficulty, status, etc.), unique constraints to prevent duplicate
enrollments/reviews/progress rows, `created_at`/`updated_at` timestamps, and indexes on foreign keys and the
columns used for search/filtering.

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a remote instance)

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE edtech;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET if needed
npm install
npm run db:migrate        # creates all tables
npm run db:seed           # populates goals, skills, courses, journeys, projects, assessments, demo users
npm run dev                # starts the API on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL should point at the backend above
npm install
npm run dev                # starts the app on http://localhost:5173
```

### Demo account

```
email:    demo@pathtoskill.com
password: Password123!
```

This account is mid-way through the Full-Stack Development journey (2 of 8 courses completed, one in
progress) so the dashboard, learning path, and progress pages have real data to show immediately.

## Environment Variables

**backend/.env**

| Variable                      | Description                                             |
|--------------------------------|-----------------------------------------------------------|
| `DATABASE_URL`                 | PostgreSQL connection string                             |
| `JWT_SECRET`                   | Secret used to sign session tokens                        |
| `JWT_EXPIRES_IN`               | Session token lifetime (e.g. `7d`)                        |
| `CLIENT_ORIGIN`                | Comma-separated allowed CORS origin(s). Not needed for the combined single-service deploy (same-origin) |
| `RESET_TOKEN_EXPIRES_MINUTES`  | Password reset token lifetime in minutes                  |
| `PORT`                         | API port (default `5000`)                                 |
| `FRONTEND_URL`                 | Used to build the link inside the password reset email (e.g. `https://your-frontend.onrender.com`) |
| `RESEND_API_KEY`               | API key from [resend.com](https://resend.com) used to send password reset emails. If unset, the reset token is logged server-side and returned in the API response instead (dev-only fallback) |
| `MAIL_FROM`                    | The "from" address for reset emails (e.g. `PathToSkill <onboarding@resend.dev>` — Resend's shared sandbox domain works without verifying your own domain) |

**frontend/.env**

| Variable              | Description                          |
|------------------------|----------------------------------------|
| `VITE_API_BASE_URL`    | Base URL of the backend API. Use `/api` for the combined single-service deploy, or a full absolute URL (e.g. `https://your-api.onrender.com/api`) when the frontend and backend are separate services/origins |

## Database Migration & Seeding

- `npm run db:migrate` (in `backend/`) applies `db/migrations/*.sql` in order, tracked in a
  `schema_migrations` table so it's safe to re-run.
- `npm run db:seed` truncates and repopulates all content tables (`db/seed.js`), then reseeds:
  goals, skills, instructors, 40 courses (with generated lesson curricula), 15 projects, the 5 required
  learning journeys with full timelines, 5 skill assessments, 5 "learner journey" backing accounts (used only
  to attribute reviews and completed journeys — never exposed as real profiles), and one interactive demo
  account. Safe to re-run at any time during development — it always starts from a clean slate.
- `npm run db:reset` runs both in sequence.

## Testing

This project was manually tested end-to-end against a running PostgreSQL instance, covering:

- **Auth**: signup (with confirm-password matching), login, invalid login, logout, forgot password
  (emailed via Resend, with a dev-mode token fallback when no API key is configured), reset password
  (invalid token rejected, valid token accepted, tokens are single-use, matching confirm-password required)
- **Onboarding**: goal → level → skills → preference, persisted to `users`/`user_skills`
- **Search**: global search matching, partial matching, no-results state, clear
- **Filters**: individual and combined filters on Courses and Journeys, reset behavior
- **Journeys**: search/filter/sort, detail view, follow (creates `user_journeys` + first enrollment), save/unsave
- **Courses**: search, detail, lesson completion, progress persistence across reloads
- **Projects**: start, complete, progress reflected on the project card and dashboard
- **Assessments**: submit, scoring, result persistence, resulting level calculation
- **Notifications**: unread badge, mark one as read, mark all as read
- **Responsive**: verified layouts at desktop, tablet, and mobile breakpoints

Both `npm run build` (frontend) and a full backend route smoke test (via direct HTTP calls covering every
endpoint above) were run before considering the app complete.

## Deployment

The repo includes a `render.yaml` (Render "Blueprint") that provisions **3 services**: a managed PostgreSQL
instance, a Node Web Service for the API (`backend/`), and a Static Site for the frontend (`frontend/`) with
a rewrite rule so client-side routes work on refresh.

### Deploy via Blueprint

1. Render dashboard → **New +** → **Blueprint** → select this repo. Render reads `render.yaml` and creates
   the database, API service, and static site.
2. Fill in the `sync: false` variables it prompts for: the API's `CLIENT_ORIGIN`/`FRONTEND_URL` (the static
   site's URL — you may need to deploy once, copy the URL, then set these and redeploy) and, optionally,
   `RESEND_API_KEY` for real password-reset emails (see below). Set the static site's `VITE_API_BASE_URL`
   to the API service's URL + `/api`.
3. Seed the database once: open the API service's **Shell** tab and run `npm run db:seed`. (Free-plan
   services don't get Shell access — if that's the case, run `npm run db:seed` from your own machine instead,
   with `DATABASE_URL` temporarily set to the database's **External** connection string.)

### Deploy manually instead

1. Create a Render PostgreSQL database, copy its **Internal Database URL**.
2. Create a Render **Web Service** from `backend/`: build command `npm install`, start command
   `npm run db:migrate && npm start`. Env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`,
   `NODE_ENV=production`, `RESET_TOKEN_EXPIRES_MINUTES=30`.
3. Create a Render **Static Site** from `frontend/`: build command `npm install && npm run build`, publish
   directory `dist`, with a rewrite rule `/* → /index.html`. Env var: `VITE_API_BASE_URL` set to the backend
   service's URL + `/api`.
4. Back on the backend service, set `CLIENT_ORIGIN` and `FRONTEND_URL` to the static site's URL (CORS won't
   work, and reset emails will link to the wrong place, until this is set).
5. Seed the database as described above.

### Sending real password reset emails (optional)

Without any email service configured, "forgot password" logs the reset token server-side and returns it in
the API response (visible on the Forgot Password page) — enough to test the flow without any setup. To send
an actual email instead:

1. Create a free account at [resend.com](https://resend.com) and generate an API key.
2. Add `RESEND_API_KEY` (the key) and `MAIL_FROM` (e.g. `PathToSkill <onboarding@resend.dev>` — Resend's
   shared sandbox domain works without verifying your own domain) to the backend's environment variables.
3. Make sure `FRONTEND_URL` is set to your deployed frontend's URL so the emailed link points to the right
   place.

Once `RESEND_API_KEY` is set, the reset link is emailed and no longer echoed back in the API response.

## AI Tools Used

This project was built with **Claude Code** (Anthropic), which was used to design the database schema,
implement the Express API, build the React frontend, write the seed data, and manually test the running
application end-to-end via direct HTTP requests against the live backend.

## Future Improvements

- Real transactional email for password resets (currently logged server-side / returned in dev mode only)
- Journey "branches" — letting a learner diverge from a followed journey and see how their path compares
- Richer peer signal: show journey adoption/completion counts without exposing any individual identity
- Instructor-authored curriculum content instead of generated lesson placeholders
- Automated test suite (integration tests against a test database, component tests for the frontend)
