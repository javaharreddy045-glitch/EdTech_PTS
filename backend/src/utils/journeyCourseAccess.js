import { query } from '../config/db.js';

// A course within a journey is: completed, active (enrolled and in progress), available
// (unlocked - the previous course is done - but not started yet), or locked. Always derived
// from enrollments + journey_courses order, so a refresh can never lose or desync it.
export async function getJourneyCourseStatuses(userId, journeyId) {
  const { rows: courses } = await query(
    `SELECT jc.order_index, c.id, c.slug
     FROM journey_courses jc JOIN courses c ON c.id = jc.course_id
     WHERE jc.journey_id = $1 ORDER BY jc.order_index`,
    [journeyId]
  );

  if (!userId) {
    return courses.map((c, i) => ({ ...c, status: i === 0 ? 'available' : 'locked' }));
  }

  const { rows: enrollments } = await query(
    `SELECT e.course_id, e.status, e.progress_percent FROM enrollments e
     JOIN journey_courses jc ON jc.course_id = e.course_id
     WHERE e.user_id = $1 AND jc.journey_id = $2`,
    [userId, journeyId]
  );
  const enrollmentMap = new Map(enrollments.map((e) => [e.course_id, e]));

  let previousCompleted = true; // the first course is always available
  return courses.map((course) => {
    const enrollment = enrollmentMap.get(course.id);
    const isCompleted = enrollment?.status === 'completed';
    let status;
    if (isCompleted) status = 'completed';
    else if (enrollment) status = 'active';
    else if (previousCompleted) status = 'available';
    else status = 'locked';
    previousCompleted = isCompleted;
    return { ...course, status, progressPercent: enrollment?.progress_percent || 0 };
  });
}
