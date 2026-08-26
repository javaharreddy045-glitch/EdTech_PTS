import { query } from '../config/db.js';

// A journey's full progression sequence: courses and projects merged into one ordered list.
// Each project is spliced in right after the course it's designed to follow (set at seed time
// via journey_projects.insert_after_course_order_index); a project with no placement, or one
// pointing past the journey's last course, lands at the very end as a capstone. Status
// (completed/active/available/locked) is derived from this single merged order, so a project
// placed mid-journey unlocks as soon as the courses before it are done - it never waits for
// every course in the journey to finish.
export async function getJourneyTimeline(userId, journeyId) {
  const { rows: courses } = await query(
    `SELECT jc.order_index, c.id, c.title, c.slug, c.description, c.difficulty, c.duration_hours, c.image_url,
            COALESCE(e.status, 'not_started') AS raw_status, COALESCE(e.progress_percent, 0) AS progress_percent
     FROM journey_courses jc JOIN courses c ON c.id = jc.course_id
     LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
     WHERE jc.journey_id = $2 ORDER BY jc.order_index`,
    [userId, journeyId]
  );
  const { rows: projects } = await query(
    `SELECT jp.order_index, jp.insert_after_course_order_index, p.id, p.title, p.slug, p.description,
            p.difficulty, p.estimated_hours AS duration_hours, p.image_url,
            COALESCE(up.status, 'not_started') AS raw_status, COALESCE(up.progress_percent, 0) AS progress_percent
     FROM journey_projects jp JOIN projects p ON p.id = jp.project_id
     LEFT JOIN user_projects up ON up.project_id = p.id AND up.user_id = $1
     WHERE jp.journey_id = $2 ORDER BY jp.order_index`,
    [userId, journeyId]
  );

  const courseItems = courses.map((c) => ({
    type: 'course',
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    difficulty: c.difficulty,
    durationHours: c.duration_hours,
    imageUrl: c.image_url,
    orderIndex: c.order_index,
    isCompleted: c.raw_status === 'completed',
    isStarted: c.raw_status === 'active',
    progressPercent: c.progress_percent,
  }));
  const projectItems = projects.map((p) => ({
    type: 'project',
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    difficulty: p.difficulty,
    durationHours: p.duration_hours,
    imageUrl: p.image_url,
    orderIndex: p.order_index,
    insertAfterCourseOrderIndex: p.insert_after_course_order_index,
    isCompleted: p.raw_status === 'completed',
    isStarted: p.raw_status === 'in_progress',
    progressPercent: p.progress_percent,
  }));

  const lastCourseOrderIndex = courseItems.length > 0 ? courseItems[courseItems.length - 1].orderIndex : 0;
  const merged = [];
  for (const course of courseItems) {
    merged.push(course);
    for (const project of projectItems) {
      if (project.insertAfterCourseOrderIndex === course.orderIndex) merged.push(project);
    }
  }
  for (const project of projectItems) {
    const isPlacedMidway = project.insertAfterCourseOrderIndex != null && project.insertAfterCourseOrderIndex <= lastCourseOrderIndex;
    if (!isPlacedMidway) merged.push(project);
  }

  let previousCompleted = true;
  return merged.map(({ isCompleted, isStarted, insertAfterCourseOrderIndex, ...item }) => {
    let status;
    if (isCompleted) status = 'completed';
    else if (isStarted) status = 'active';
    else if (previousCompleted) status = 'available';
    else status = 'locked';
    previousCompleted = isCompleted;
    return { ...item, status };
  });
}
