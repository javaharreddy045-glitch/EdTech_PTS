import { query } from '../config/db.js';

// A lesson is: completed (finished), available (the next one up, or already completed lessons
// stay revisitable), or locked (the previous lesson isn't done yet). Always derived from
// lesson_progress + order_index - never stored as its own state, so a refresh can't lose it.
// Once a lesson becomes available it stays available forever, because completion is
// monotonic - so no separate "previously opened" tracking is needed.
export async function getLessonAccessMap(userId, courseId) {
  const { rows: lessons } = await query(
    'SELECT id FROM lessons WHERE course_id = $1 ORDER BY order_index',
    [courseId]
  );

  const statusMap = new Map();

  if (!userId) {
    lessons.forEach((lesson, i) => statusMap.set(lesson.id, i === 0 ? 'available' : 'locked'));
    return statusMap;
  }

  const { rows: progress } = await query(
    `SELECT lp.lesson_id, lp.completed FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id WHERE lp.user_id = $1 AND l.course_id = $2 AND lp.completed = true`,
    [userId, courseId]
  );
  const completedSet = new Set(progress.map((p) => p.lesson_id));

  let previousCompleted = true; // the first lesson is always available
  for (const lesson of lessons) {
    const isCompleted = completedSet.has(lesson.id);
    statusMap.set(lesson.id, isCompleted ? 'completed' : previousCompleted ? 'available' : 'locked');
    previousCompleted = isCompleted;
  }

  return statusMap;
}
