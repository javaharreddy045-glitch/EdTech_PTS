-- Marks the seeded "Learners Like You" personas explicitly, rather than relying on
-- their email domain, so the API can reliably tell demo showcase profiles apart from
-- real registered accounts.

ALTER TABLE users ADD COLUMN is_demo_profile BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_users_is_demo_profile ON users(is_demo_profile) WHERE is_demo_profile = true;
