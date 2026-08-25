-- Adds real video resources to lessons, and turns projects into a milestone/checkpoint
-- workspace instead of a flat start/complete status.

ALTER TABLE lessons ADD COLUMN video_url TEXT;
ALTER TABLE lessons ADD COLUMN video_provider VARCHAR(80);
ALTER TABLE lessons ADD COLUMN video_duration_minutes INTEGER;

-- Structure: what a project's milestones/checkpoints are (same for every learner).
CREATE TABLE project_milestones (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title VARCHAR(160) NOT NULL,
  goal TEXT,
  UNIQUE (project_id, order_index)
);
CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);

CREATE TABLE project_tasks (
  id SERIAL PRIMARY KEY,
  milestone_id INTEGER NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title VARCHAR(220) NOT NULL,
  task_type VARCHAR(20) NOT NULL DEFAULT 'task' CHECK (task_type IN ('task','knowledge_check','code','review','deliverable')),
  UNIQUE (milestone_id, order_index)
);
CREATE INDEX idx_project_tasks_milestone ON project_tasks(milestone_id);

-- Progress: which tasks a specific learner has checked off. Milestone/overall project
-- progress is always derived from this at read time rather than duplicated in storage.
CREATE TABLE user_project_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, task_id)
);
CREATE INDEX idx_user_project_tasks_user ON user_project_tasks(user_id);

-- Final deliverable submission fields for "Mark Project Complete".
ALTER TABLE user_projects ADD COLUMN github_url TEXT;
ALTER TABLE user_projects ADD COLUMN deployment_url TEXT;
ALTER TABLE user_projects ADD COLUMN submission_notes TEXT;
