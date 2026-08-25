// Generates realistic lesson sequences for a course without hand-authoring every course individually.

const STAGE_LABELS = ['Introduction', 'Core Concepts', 'Hands-On Practice', 'Applying What You Learned', 'Review & Quiz'];

export function buildLessonsForCourse(course) {
  const primarySkill = course.skills[0];
  const lessons = [];

  lessons.push({
    title: `Welcome to ${course.title}`,
    content: `An overview of what you'll learn in ${course.title}, why it matters for your goal, and how the course is structured. This lesson introduces ${primarySkill} at a high level before we go hands-on.`,
    duration_minutes: 8,
    resources: [{ label: 'Course syllabus', url: '#' }],
  });

  lessons.push({
    title: `Core Concepts of ${primarySkill}`,
    content: `A deep dive into the fundamental ideas behind ${primarySkill}. We cover terminology, common patterns, and the mental models you'll rely on throughout the rest of the course.`,
    duration_minutes: 22,
    resources: [{ label: 'Concept cheat sheet', url: '#' }],
    ...(course.video
      ? { video_url: course.video.url, video_provider: course.video.provider, video_duration_minutes: course.video.durationMinutes }
      : {}),
  });

  lessons.push({
    title: `Working with ${primarySkill} in Practice`,
    content: `Follow along with guided, hands-on exercises applying ${primarySkill} to realistic scenarios. By the end of this lesson you will be comfortable using it independently.`,
    duration_minutes: 30,
    resources: [{ label: 'Starter exercise files', url: '#' }],
  });

  lessons.push({
    title: `Common Mistakes & Best Practices`,
    content: `A look at the mistakes most learners make with ${primarySkill}, and the best practices experienced practitioners use to avoid them.`,
    duration_minutes: 18,
    resources: [{ label: 'Best practices guide', url: '#' }],
  });

  lessons.push({
    title: `${course.title}: Review & Knowledge Check`,
    content: `A summary of everything covered in ${course.title}, followed by a short knowledge check to confirm you're ready to move on.`,
    duration_minutes: 15,
    resources: [{ label: 'Summary notes', url: '#' }],
    quiz: {
      question: `Which skill was the primary focus of "${course.title}"?`,
      options: shuffleWithAnswer(primarySkill, course.skills),
    },
  });

  return lessons.map((lesson, index) => ({ ...lesson, order_index: index + 1 }));
}

function shuffleWithAnswer(correct, allSkills) {
  const distractors = ['Public Speaking', 'Accounting Basics', 'Photography', 'Cooking Techniques'].filter(
    (d) => !allSkills.includes(d)
  );
  const options = [correct, distractors[0], distractors[1], distractors[2] || 'Time Management'];
  return { choices: options, correctIndex: 0 };
}
