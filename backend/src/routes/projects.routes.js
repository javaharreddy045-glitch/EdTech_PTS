import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { notFound, forbidden, badRequest } from '../utils/errors.js';

const router = Router();

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Builds the full milestone/checkpoint workspace for one learner on one project.
// Milestone lock state, completion, and overall progress are always derived from
// user_project_tasks - never stored - so a refresh can never lose or desync progress.
async function getProjectWorkspace(userId, projectId) {
  const { rows: milestoneRows } = await query(
    'SELECT id, order_index, title, goal FROM project_milestones WHERE project_id = $1 ORDER BY order_index',
    [projectId]
  );

  const { rows: taskRows } = await query(
    `SELECT t.id, t.milestone_id, t.order_index, t.title, t.task_type,
            COALESCE(ut.completed, false) AS completed, ut.completed_at
     FROM project_tasks t
     JOIN project_milestones m ON m.id = t.milestone_id
     LEFT JOIN user_project_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
     WHERE m.project_id = $2
     ORDER BY t.milestone_id, t.order_index`,
    [userId, projectId]
  );

  const tasksByMilestone = new Map();
  for (const task of taskRows) {
    if (!tasksByMilestone.has(task.milestone_id)) tasksByMilestone.set(task.milestone_id, []);
    tasksByMilestone.get(task.milestone_id).push(task);
  }

  let previousComplete = true; // the first milestone is always available
  const milestones = milestoneRows.map((milestone) => {
    const tasks = tasksByMilestone.get(milestone.id) || [];
    const completedCount = tasks.filter((t) => t.completed).length;
    const isComplete = tasks.length > 0 && completedCount === tasks.length;
    const status = isComplete ? 'completed' : previousComplete ? 'available' : 'locked';
    previousComplete = isComplete;
    return {
      id: milestone.id,
      orderIndex: milestone.order_index,
      title: milestone.title,
      goal: milestone.goal,
      status,
      tasks: tasks.map((t) => ({ id: t.id, orderIndex: t.order_index, title: t.title, taskType: t.task_type, completed: t.completed })),
      completedCount,
      totalCount: tasks.length,
    };
  });

  const totalTasks = taskRows.length;
  const completedTasks = taskRows.filter((t) => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const allComplete = totalTasks > 0 && completedTasks === totalTasks;
  const currentMilestone = milestones.find((m) => m.status === 'available') || null;

  return { milestones, overallProgress, allComplete, currentMilestone, totalTasks, completedTasks };
}

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, skill, difficulty } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (difficulty) {
    params.push(difficulty);
    conditions.push(`p.difficulty = $${params.length}`);
  }
  if (skill) {
    params.push(skill);
    conditions.push(`EXISTS (SELECT 1 FROM project_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = p.id AND s.slug = $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT p.id, p.title, p.slug, p.description, p.difficulty, p.estimated_hours, p.image_url,
            COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '{}') AS skills
     FROM projects p
     LEFT JOIN project_skills ps ON ps.project_id = p.id
     LEFT JOIN skills s ON s.id = ps.skill_id
     ${where}
     GROUP BY p.id ORDER BY p.title`,
    params
  );

  let statusMap = {};
  if (req.user) {
    const { rows: statuses } = await query('SELECT project_id, status, progress_percent FROM user_projects WHERE user_id = $1', [req.user.id]);
    statusMap = Object.fromEntries(statuses.map((s) => [s.project_id, s]));
  }

  res.json({ projects: rows.map((p) => ({ ...p, status: statusMap[p.id]?.status || 'not_started', progressPercent: statusMap[p.id]?.progress_percent || 0 })) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.title, p.slug, p.difficulty, p.estimated_hours, p.image_url,
            up.status, up.progress_percent, up.started_at, up.completed_at
     FROM user_projects up JOIN projects p ON p.id = up.project_id
     WHERE up.user_id = $1 ORDER BY up.started_at DESC NULLS LAST`,
    [req.user.id]
  );
  res.json({ projects: rows });
}));

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM projects WHERE slug = $1', [req.params.slug]);
  if (rows.length === 0) throw notFound('Project not found.');
  const project = rows[0];

  const [{ rows: skills }, { rows: relatedCourses }] = await Promise.all([
    query('SELECT s.id, s.name FROM project_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.project_id = $1', [project.id]),
    query(
      `SELECT c.id, c.title, c.slug FROM project_related_courses prc JOIN courses c ON c.id = prc.course_id WHERE prc.project_id = $1`,
      [project.id]
    ),
  ]);

  let status = 'not_started';
  let progressPercent = 0;
  let userProjectDetails = null;
  let workspace = null;
  if (req.user) {
    const { rows: statusRows } = await query(
      'SELECT status, progress_percent, github_url, deployment_url, submission_notes FROM user_projects WHERE user_id = $1 AND project_id = $2',
      [req.user.id, project.id]
    );
    if (statusRows.length > 0) {
      status = statusRows[0].status;
      progressPercent = statusRows[0].progress_percent;
      userProjectDetails = statusRows[0];
      workspace = await getProjectWorkspace(req.user.id, project.id);
    }
  }

  res.json({ project: { ...project, skills, relatedCourses, status, progressPercent, ...userProjectDetails, workspace } });
}));

router.post('/:id/start', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('Project not found.');

  await query(
    `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at)
     VALUES ($1, $2, 'in_progress', 0, now())
     ON CONFLICT (user_id, project_id) DO UPDATE SET
       status = CASE WHEN user_projects.status = 'completed' THEN user_projects.status ELSE 'in_progress' END,
       started_at = COALESCE(user_projects.started_at, now())`,
    [req.user.id, req.params.id]
  );

  const workspace = await getProjectWorkspace(req.user.id, req.params.id);
  res.status(201).json({ message: 'Project started.', workspace });
}));

router.post('/tasks/:taskId/toggle', requireAuth, asyncHandler(async (req, res) => {
  const { rows: taskRows } = await query(
    `SELECT t.id, t.milestone_id, m.project_id, m.order_index AS milestone_order
     FROM project_tasks t JOIN project_milestones m ON m.id = t.milestone_id
     WHERE t.id = $1`,
    [req.params.taskId]
  );
  if (taskRows.length === 0) throw notFound('Task not found.');
  const task = taskRows[0];

  const { rows: enrollRows } = await query(
    'SELECT id FROM user_projects WHERE user_id = $1 AND project_id = $2',
    [req.user.id, task.project_id]
  );
  if (enrollRows.length === 0) throw forbidden('Start this project to track checkpoints.');

  const workspaceBefore = await getProjectWorkspace(req.user.id, task.project_id);
  const milestone = workspaceBefore.milestones.find((m) => m.id === task.milestone_id);
  if (milestone.status === 'locked') {
    throw forbidden('Complete the previous milestone to unlock this checkpoint.');
  }

  const currentlyCompleted = milestone.tasks.find((t) => t.id === Number(req.params.taskId))?.completed || false;
  const nextCompleted = !currentlyCompleted;

  await query(
    `INSERT INTO user_project_tasks (user_id, task_id, completed, completed_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, task_id) DO UPDATE SET completed = $3, completed_at = $4`,
    [req.user.id, req.params.taskId, nextCompleted, nextCompleted ? new Date() : null]
  );

  const workspace = await getProjectWorkspace(req.user.id, task.project_id);
  await query(
    'UPDATE user_projects SET progress_percent = $1 WHERE user_id = $2 AND project_id = $3',
    [workspace.overallProgress, req.user.id, task.project_id]
  );

  res.json({ workspace });
}));

router.post('/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, title FROM projects WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('Project not found.');

  const { githubUrl, deploymentUrl, submissionNotes } = req.body || {};
  if (!isValidUrl(githubUrl)) throw badRequest('Please provide a valid GitHub URL.');
  if (!isValidUrl(deploymentUrl)) throw badRequest('Please provide a valid deployment URL.');

  const workspace = await getProjectWorkspace(req.user.id, req.params.id);
  if (workspace.totalTasks > 0 && !workspace.allComplete) {
    throw badRequest('Complete all milestones before marking this project as finished.');
  }

  await query(
    `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at, completed_at, github_url, deployment_url, submission_notes)
     VALUES ($1, $2, 'completed', 100, now(), now(), $3, $4, $5)
     ON CONFLICT (user_id, project_id) DO UPDATE SET
       status = 'completed', progress_percent = 100, completed_at = now(),
       github_url = $3, deployment_url = $4, submission_notes = $5`,
    [req.user.id, req.params.id, githubUrl || null, deploymentUrl || null, submissionNotes || null]
  );

  await query(
    `INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES ($1, 'project_completion', 'Project completed', $2, 'project', $3)`,
    [req.user.id, `You completed the "${rows[0].title}" project. Nice work!`, rows[0].id]
  );

  res.json({ message: 'Project marked complete.' });
}));

export default router;
