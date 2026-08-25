// Generates a consistent milestone/checkpoint breakdown for every seeded project so the
// project workspace always has real, functional progress data rather than a flat status.

export function buildMilestonesForProject(project) {
  const skills = project.skills;
  const milestones = [];

  milestones.push({
    title: 'Project Setup',
    goal: `Set up your development environment and understand what you're building for "${project.title}".`,
    tasks: [
      { title: 'Review the project brief and requirements', type: 'task' },
      { title: 'Set up your project folder and version control', type: 'task' },
      { title: 'Install the required tools and dependencies', type: 'task' },
      { title: `What is the primary skill this project practices: ${skills[0]}?`, type: 'knowledge_check' },
    ],
  });

  const coreSkills = skills.slice(0, Math.min(skills.length, 3));
  coreSkills.forEach((skill) => {
    milestones.push({
      title: `Build with ${skill}`,
      goal: `Apply ${skill} to implement this stage of the project.`,
      tasks: [
        { title: `Plan the ${skill} portion of the implementation`, type: 'task' },
        { title: `Implement the core ${skill} functionality`, type: 'code' },
        { title: `Test what you built with ${skill}`, type: 'review' },
      ],
    });
  });

  milestones.push({
    title: 'Final Testing & Submission',
    goal: 'Test the complete project end to end and submit your work.',
    tasks: [
      { title: 'Test all functionality end-to-end', type: 'review' },
      { title: 'Fix any remaining issues you find', type: 'task' },
      { title: 'Submit your completed project', type: 'deliverable' },
    ],
  });

  return milestones.map((milestone, mIndex) => ({
    ...milestone,
    order_index: mIndex + 1,
    tasks: milestone.tasks.map((task, tIndex) => ({ ...task, order_index: tIndex + 1 })),
  }));
}
