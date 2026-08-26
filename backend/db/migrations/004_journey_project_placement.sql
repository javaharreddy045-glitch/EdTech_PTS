-- Lets a journey's projects be interspersed within its course sequence (e.g. a project right
-- after the courses that teach the skills it needs) instead of always trailing every course.
-- NULL (or a value past the journey's last course) means "place at the very end" - used for
-- each journey's final capstone project.

ALTER TABLE journey_projects ADD COLUMN insert_after_course_order_index INTEGER;
