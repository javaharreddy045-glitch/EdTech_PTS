// One representative, verified image per goal (same curated Unsplash photos used for course/project
// cards of that category), so journey cards get a real, relevant visual without needing a schema change.
const IMAGE_BY_GOAL_SLUG = {
  'full-stack-developer': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=75',
  'ai-ml-engineer': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=75',
  'product-designer': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=75',
  'data-analyst': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=75',
  'digital-marketing-specialist': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=800&q=75',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=75';

export function getJourneyImage(goalSlug) {
  return IMAGE_BY_GOAL_SLUG[goalSlug] || FALLBACK_IMAGE;
}
