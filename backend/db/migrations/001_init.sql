-- PathToSkill initial schema
-- Design: keep peer-identifying data out of the schema entirely (learner_label only).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== Reference / lookup tables ==========

CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skills_category ON skills(category);

CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  title VARCHAR(160),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== Users ==========

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  current_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  current_level VARCHAR(20) CHECK (current_level IN ('beginner','intermediate','advanced')),
  learning_preference VARCHAR(20) CHECK (learning_preference IN ('courses','projects','practice','mixed')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_goal ON users(current_goal_id);

CREATE TABLE user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (proficiency IN ('basic','intermediate','advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens(token_hash);

-- ========== Courses ==========

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
  category VARCHAR(80) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  duration_hours NUMERIC(5,1) NOT NULL DEFAULT 0,
  price NUMERIC(8,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  learning_outcomes TEXT[],
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  learner_count INTEGER NOT NULL DEFAULT 0,
  project_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_title ON courses USING gin (to_tsvector('english', title));

CREATE TABLE course_skills (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE (course_id, skill_id)
);
CREATE INDEX idx_course_skills_course ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill ON course_skills(skill_id);

CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  resources JSONB NOT NULL DEFAULT '[]',
  quiz JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, order_index)
);
CREATE INDEX idx_lessons_course ON lessons(course_id);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_reviews_course ON reviews(course_id);

-- ========== Projects ==========

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  estimated_hours NUMERIC(5,1) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_difficulty ON projects(difficulty);

CREATE TABLE project_skills (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE (project_id, skill_id)
);

CREATE TABLE project_related_courses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE (project_id, course_id)
);

CREATE TABLE user_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, project_id)
);
CREATE INDEX idx_user_projects_user ON user_projects(user_id);

-- ========== Learning Journeys (the core differentiator) ==========

CREATE TABLE learning_journeys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  learner_label VARCHAR(60) NOT NULL DEFAULT 'Learner Journey',
  starting_level VARCHAR(20) NOT NULL CHECK (starting_level IN ('beginner','intermediate','advanced')),
  description TEXT,
  outcome VARCHAR(160) NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_journeys_goal ON learning_journeys(goal_id);
CREATE INDEX idx_journeys_level ON learning_journeys(starting_level);

CREATE TABLE journey_starting_skills (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  label VARCHAR(80),
  UNIQUE (journey_id, skill_id)
);

CREATE TABLE journey_skills_gained (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE (journey_id, skill_id)
);

CREATE TABLE journey_steps (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  phase VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  skill_id INTEGER REFERENCES skills(id) ON DELETE SET NULL,
  UNIQUE (journey_id, order_index)
);
CREATE INDEX idx_journey_steps_journey ON journey_steps(journey_id);

CREATE TABLE journey_courses (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE (journey_id, course_id),
  UNIQUE (journey_id, order_index)
);
CREATE INDEX idx_journey_courses_journey ON journey_courses(journey_id);

CREATE TABLE journey_projects (
  id SERIAL PRIMARY KEY,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE (journey_id, project_id),
  UNIQUE (journey_id, order_index)
);
CREATE INDEX idx_journey_projects_journey ON journey_projects(journey_id);

CREATE TABLE saved_journeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, journey_id)
);

CREATE TABLE user_journeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id INTEGER NOT NULL REFERENCES learning_journeys(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, journey_id)
);
CREATE INDEX idx_user_journeys_user ON user_journeys(user_id);

-- ========== Assessments ==========

CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  skill_id INTEGER REFERENCES skills(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_questions (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  UNIQUE (assessment_id, order_index)
);

CREATE TABLE assessment_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  resulting_level VARCHAR(20) NOT NULL CHECK (resulting_level IN ('beginner','intermediate','advanced')),
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_assessment_results_user ON assessment_results(user_id);

-- ========== Notifications ==========

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type VARCHAR(40),
  related_entity_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
