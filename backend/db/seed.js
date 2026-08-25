import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { goals, skills, instructors, courses, projects, journeys, assessments } from './seeds/data.js';
import { buildLessonsForCourse } from './seeds/lessonTemplates.js';

const { Pool } = pg;
// Render's external database URLs require SSL; local/internal connections don't.
const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const client = await pool.connect();
  try {
    console.log('Resetting existing data...');
    await client.query(`
      TRUNCATE TABLE
        notifications, assessment_results, assessment_questions, assessments,
        saved_journeys, user_journeys, journey_projects, journey_courses,
        journey_steps, journey_skills_gained, journey_starting_skills, learning_journeys,
        user_projects, project_related_courses, project_skills, projects,
        reviews, lesson_progress, enrollments, lessons, course_skills, courses,
        instructors, password_reset_tokens, user_skills, users, skills, goals
      RESTART IDENTITY CASCADE;
    `);

    console.log('Seeding goals...');
    const goalMap = new Map();
    for (const g of goals) {
      const { rows } = await client.query(
        'INSERT INTO goals (title, slug, description) VALUES ($1,$2,$3) RETURNING id',
        [g.title, g.slug, g.description]
      );
      goalMap.set(g.title, rows[0].id);
    }

    console.log('Seeding skills...');
    const skillMap = new Map();
    for (const s of skills) {
      const { rows } = await client.query(
        'INSERT INTO skills (name, slug, category) VALUES ($1,$2,$3) RETURNING id',
        [s.name, s.slug, s.category]
      );
      skillMap.set(s.name, rows[0].id);
    }

    console.log('Seeding instructors...');
    const instructorMap = new Map();
    for (const i of instructors) {
      const { rows } = await client.query(
        'INSERT INTO instructors (name, title, bio) VALUES ($1,$2,$3) RETURNING id',
        [i.name, i.title, i.bio]
      );
      instructorMap.set(i.name, rows[0].id);
    }

    console.log('Seeding courses, skills, and lessons...');
    const courseMap = new Map();
    const courseObjBySlug = new Map();
    for (const c of courses) {
      const instructorId = instructorMap.get(c.instructor) ?? null;
      const { rows } = await client.query(
        `INSERT INTO courses
          (title, slug, description, instructor_id, category, difficulty, duration_hours, price, image_url, learning_outcomes, project_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [
          c.title,
          c.slug,
          c.description || `Learn ${c.skills[0]} through structured lessons, hands-on practice, and real examples.`,
          instructorId,
          c.category,
          c.difficulty,
          c.duration_hours,
          c.price,
          `https://placehold.co/640x360/EDE7DA/2B2B28?text=${encodeURIComponent(c.title)}`,
          c.learning_outcomes,
          c.project_count || 0,
        ]
      );
      const courseId = rows[0].id;
      courseMap.set(c.slug, courseId);
      courseObjBySlug.set(c.slug, c);

      for (const skillName of c.skills) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO course_skills (course_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [courseId, skillId]
          );
        }
      }

      const lessons = buildLessonsForCourse(c);
      for (const lesson of lessons) {
        await client.query(
          `INSERT INTO lessons (course_id, title, content, order_index, duration_minutes, resources, quiz)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            courseId,
            lesson.title,
            lesson.content,
            lesson.order_index,
            lesson.duration_minutes,
            JSON.stringify(lesson.resources || []),
            lesson.quiz ? JSON.stringify(lesson.quiz) : null,
          ]
        );
      }
    }

    console.log('Seeding projects...');
    const projectMap = new Map();
    for (const p of projects) {
      const { rows } = await client.query(
        `INSERT INTO projects (title, slug, description, difficulty, estimated_hours, image_url)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [
          p.title,
          p.slug,
          p.description,
          p.difficulty,
          p.estimated_hours,
          `https://placehold.co/640x360/DDE5DD/2B2B28?text=${encodeURIComponent(p.title)}`,
        ]
      );
      const projectId = rows[0].id;
      projectMap.set(p.slug, projectId);

      for (const skillName of p.skills) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO project_skills (project_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [projectId, skillId]
          );
        }
      }
      for (const courseSlug of p.relatedCourses || []) {
        const relatedCourseId = courseMap.get(courseSlug);
        if (relatedCourseId) {
          await client.query(
            'INSERT INTO project_related_courses (project_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [projectId, relatedCourseId]
          );
        }
      }
    }

    console.log('Seeding learning journeys...');
    const journeyMap = new Map();
    for (const j of journeys) {
      const goalId = goalMap.get(j.goal);
      const { rows } = await client.query(
        `INSERT INTO learning_journeys
          (title, slug, goal_id, learner_label, starting_level, description, outcome, duration_weeks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [j.title, j.slug, goalId, j.learner_label, j.starting_level, j.description, j.outcome, j.duration_weeks]
      );
      const journeyId = rows[0].id;
      journeyMap.set(j.slug, journeyId);

      for (const skillName of j.startingSkills) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO journey_starting_skills (journey_id, skill_id, label) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [journeyId, skillId, j.startingSkillLabels?.[skillName] || skillName]
          );
        }
      }

      for (const [idx, skillName] of j.skillsGained.entries()) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO journey_skills_gained (journey_id, skill_id, order_index) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [journeyId, skillId, idx]
          );
        }
      }

      for (const [idx, step] of j.steps.entries()) {
        const skillId = skillMap.get(step.skill) || null;
        await client.query(
          'INSERT INTO journey_steps (journey_id, order_index, phase, title, skill_id) VALUES ($1,$2,$3,$4,$5)',
          [journeyId, idx + 1, step.phase, step.title, skillId]
        );
      }

      for (const [idx, slug] of j.courseSlugs.entries()) {
        const courseId = courseMap.get(slug);
        await client.query(
          'INSERT INTO journey_courses (journey_id, course_id, order_index) VALUES ($1,$2,$3)',
          [journeyId, courseId, idx + 1]
        );
      }

      for (const [idx, slug] of j.projectSlugs.entries()) {
        const projectId = projectMap.get(slug);
        await client.query(
          'INSERT INTO journey_projects (journey_id, project_id, order_index) VALUES ($1,$2,$3)',
          [journeyId, projectId, idx + 1]
        );
      }
    }

    console.log('Seeding assessments...');
    const assessmentMap = new Map();
    for (const a of assessments) {
      const skillId = skillMap.get(a.skill) || null;
      const { rows } = await client.query(
        'INSERT INTO assessments (title, slug, skill_id, description) VALUES ($1,$2,$3,$4) RETURNING id',
        [a.title, a.slug, skillId, a.description]
      );
      const assessmentId = rows[0].id;
      assessmentMap.set(a.slug, assessmentId);

      for (const [idx, q] of a.questions.entries()) {
        await client.query(
          `INSERT INTO assessment_questions (assessment_id, question_text, options, correct_option_index, order_index)
           VALUES ($1,$2,$3,$4,$5)`,
          [assessmentId, q.question_text, JSON.stringify(q.options), q.correct_option_index, idx + 1]
        );
      }
    }

    console.log('Seeding learner journey accounts (backing data for peer journeys)...');
    const placeholderHash = await bcrypt.hash('not-a-real-login-account', 10);
    const learnerReviewComments = [
      'Clear explanations and practical examples. This set me up well for the next step.',
      'Exactly the right amount of depth for where I was starting from.',
      'The hands-on exercises made the concepts stick much faster than just reading.',
      'Well paced. I felt ready to move on right after finishing this.',
      'Practical and to the point. Helped me build real confidence in this skill.',
    ];

    for (const j of journeys) {
      const goalId = goalMap.get(j.goal);
      const { rows: userRows } = await client.query(
        `INSERT INTO users (name, email, password_hash, current_goal_id, current_level, learning_preference, onboarding_completed)
         VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
        [
          j.learner_label,
          `${j.slug}@seed.pathtoskill.internal`,
          placeholderHash,
          goalId,
          j.starting_level,
          'mixed',
        ]
      );
      const userId = userRows[0].id;
      const journeyId = journeyMap.get(j.slug);

      for (const skillName of j.startingSkills) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [userId, skillId, 'basic']
          );
        }
      }
      for (const skillName of j.skillsGained) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [userId, skillId, 'advanced']
          );
        }
      }

      await client.query(
        'INSERT INTO user_journeys (user_id, journey_id, status, started_at, completed_at) VALUES ($1,$2,$3,$4,$5)',
        [userId, journeyId, 'completed', daysAgo(140), daysAgo(10)]
      );

      for (const [idx, slug] of j.courseSlugs.entries()) {
        const courseId = courseMap.get(slug);
        const enrolledAt = daysAgo(140 - idx * 12);
        const completedAt = daysAgo(140 - idx * 12 - 10);
        await client.query(
          `INSERT INTO enrollments (user_id, course_id, status, progress_percent, enrolled_at, completed_at)
           VALUES ($1,$2,'completed',100,$3,$4)`,
          [userId, courseId, enrolledAt, completedAt]
        );
        const { rows: lessonRows } = await client.query(
          'SELECT id FROM lessons WHERE course_id = $1 ORDER BY order_index',
          [courseId]
        );
        for (const lessonRow of lessonRows) {
          await client.query(
            'INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES ($1,$2,true,$3)',
            [userId, lessonRow.id, completedAt]
          );
        }

        if (idx % 3 === 0) {
          const comment = learnerReviewComments[(idx + journeyId) % learnerReviewComments.length];
          await client.query(
            'INSERT INTO reviews (user_id, course_id, rating, comment, created_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
            [userId, courseId, idx % 2 === 0 ? 5 : 4, comment, completedAt]
          );
        }
      }

      for (const [idx, slug] of j.projectSlugs.entries()) {
        const projectId = projectMap.get(slug);
        const startedAt = daysAgo(60 - idx * 15);
        const completedAt = daysAgo(50 - idx * 15);
        await client.query(
          `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at, completed_at)
           VALUES ($1,$2,'completed',100,$3,$4)`,
          [userId, projectId, startedAt, completedAt]
        );
      }
    }

    console.log('Seeding demo learner account...');
    const demoPasswordHash = await bcrypt.hash('Password123!', 10);
    const fullStackGoalId = goalMap.get('Full-Stack Developer');
    const { rows: demoRows } = await client.query(
      `INSERT INTO users (name, email, password_hash, current_goal_id, current_level, learning_preference, onboarding_completed)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
      ['Demo Learner', 'demo@pathtoskill.com', demoPasswordHash, fullStackGoalId, 'beginner', 'mixed']
    );
    const demoUserId = demoRows[0].id;

    for (const skillName of ['JavaScript', 'HTML', 'CSS']) {
      await client.query(
        'INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [demoUserId, skillMap.get(skillName), 'basic']
      );
    }

    const fsJourneyId = journeyMap.get('full-stack-development-journey');
    await client.query(
      'INSERT INTO user_journeys (user_id, journey_id, status, started_at) VALUES ($1,$2,$3,$4)',
      [demoUserId, fsJourneyId, 'active', daysAgo(21)]
    );
    await client.query(
      'INSERT INTO saved_journeys (user_id, journey_id) VALUES ($1,$2)',
      [demoUserId, journeyMap.get('ai-machine-learning-journey')]
    );

    const fsJourney = journeys.find((j) => j.slug === 'full-stack-development-journey');
    for (const [idx, slug] of fsJourney.courseSlugs.entries()) {
      const courseId = courseMap.get(slug);
      const { rows: lessonRows } = await client.query(
        'SELECT id FROM lessons WHERE course_id = $1 ORDER BY order_index',
        [courseId]
      );
      if (idx < 2) {
        // Completed: HTML/CSS Fundamentals, JavaScript Fundamentals
        await client.query(
          `INSERT INTO enrollments (user_id, course_id, status, progress_percent, enrolled_at, completed_at)
           VALUES ($1,$2,'completed',100,$3,$4)`,
          [demoUserId, courseId, daysAgo(21 - idx * 7), daysAgo(14 - idx * 7)]
        );
        for (const lessonRow of lessonRows) {
          await client.query(
            'INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES ($1,$2,true,$3)',
            [demoUserId, lessonRow.id, daysAgo(14 - idx * 7)]
          );
        }
      } else if (idx === 2) {
        // In progress: React for Beginners - first 2 of 5 lessons done
        await client.query(
          `INSERT INTO enrollments (user_id, course_id, status, progress_percent, enrolled_at)
           VALUES ($1,$2,'active',40,$3)`,
          [demoUserId, courseId, daysAgo(6)]
        );
        for (const [lIdx, lessonRow] of lessonRows.entries()) {
          if (lIdx < 2) {
            await client.query(
              'INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES ($1,$2,true,$3)',
              [demoUserId, lessonRow.id, daysAgo(3 - lIdx)]
            );
          }
        }
      }
    }

    await client.query(
      `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at, completed_at)
       VALUES ($1,$2,'completed',100,$3,$4)`,
      [demoUserId, projectMap.get('personal-portfolio'), daysAgo(13), daysAgo(11)]
    );
    await client.query(
      `INSERT INTO user_projects (user_id, project_id, status, progress_percent, started_at)
       VALUES ($1,$2,'not_started',0,NULL)`,
      [demoUserId, projectMap.get('task-management-application')]
    );

    const jsAssessmentId = assessmentMap.get('javascript-basics-check');
    await client.query(
      `INSERT INTO assessment_results (user_id, assessment_id, score, total_questions, correct_count, resulting_level, taken_at)
       VALUES ($1,$2,80,5,4,'intermediate',$3)`,
      [demoUserId, jsAssessmentId, daysAgo(15)]
    );

    await client.query(
      'INSERT INTO reviews (user_id, course_id, rating, comment, created_at) VALUES ($1,$2,$3,$4,$5)',
      [demoUserId, courseMap.get('javascript-fundamentals'), 5, 'Finally understood closures and async code thanks to this course.', daysAgo(14)]
    );

    const notifications = [
      {
        type: 'course_completion',
        title: 'Course completed',
        message: 'You completed "JavaScript Fundamentals". Great progress on your Full-Stack Development journey!',
        is_read: true,
        related_entity_type: 'course',
        related_entity_id: courseMap.get('javascript-fundamentals'),
        created_at: daysAgo(14),
      },
      {
        type: 'milestone',
        title: 'Milestone reached',
        message: "You've completed 2 of 8 courses in your Full-Stack Development journey.",
        is_read: true,
        related_entity_type: 'journey',
        related_entity_id: fsJourneyId,
        created_at: daysAgo(13),
      },
      {
        type: 'assessment_result',
        title: 'Assessment result ready',
        message: 'You scored 80% on the JavaScript Basics Check and are ready for intermediate content.',
        is_read: true,
        related_entity_type: 'assessment',
        related_entity_id: jsAssessmentId,
        created_at: daysAgo(15),
      },
      {
        type: 'project_completion',
        title: 'Project completed',
        message: 'You completed the "Personal Portfolio" project. Nice work!',
        is_read: false,
        related_entity_type: 'project',
        related_entity_id: projectMap.get('personal-portfolio'),
        created_at: daysAgo(11),
      },
      {
        type: 'new_recommendation',
        title: 'New course recommended',
        message: '"Advanced React & Frontend Development" was added to your recommended courses.',
        is_read: false,
        related_entity_type: 'course',
        related_entity_id: courseMap.get('advanced-react-frontend'),
        created_at: daysAgo(5),
      },
      {
        type: 'journey_recommendation',
        title: 'A journey similar to yours',
        message: 'Learners with a similar starting point also followed the AI & Machine Learning Journey.',
        is_read: false,
        related_entity_type: 'journey',
        related_entity_id: journeyMap.get('ai-machine-learning-journey'),
        created_at: daysAgo(2),
      },
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, related_entity_type, related_entity_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [demoUserId, n.type, n.title, n.message, n.is_read, n.related_entity_type, n.related_entity_id, n.created_at]
      );
    }

    console.log('Recomputing course rating and learner aggregates...');
    await client.query(`
      UPDATE courses c SET
        learner_count = COALESCE((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id), 0),
        rating_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id), 0),
        rating_avg = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM reviews r WHERE r.course_id = c.id), 0);
    `);

    console.log('Seed complete.');
    console.log('Demo login -> email: demo@pathtoskill.com / password: Password123!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
