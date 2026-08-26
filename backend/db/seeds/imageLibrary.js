// Curated, verified Unsplash photos (real, existing images - checked via direct HTTP request
// before being added here) grouped by course/project category. Using `auto=format` lets
// Unsplash's CDN serve WebP/AVIF to browsers that support it automatically.

const UNSPLASH_PARAMS = 'auto=format&fit=crop&w=800&q=75';

function img(id) {
  return `https://images.unsplash.com/photo-${id}?${UNSPLASH_PARAMS}`;
}

const CATEGORY_IMAGES = {
  'Web Development': [
    img('1498050108023-c5249f4df085'), // laptop with code editor open
    img('1461749280684-dccba630e2f6'), // hands typing code, dark workspace
    img('1432888622747-4eb9a8efeb07'), // colorful code close-up
    img('1517694712202-14dd9538aa97'), // code on monitor
  ],
  'AI & Machine Learning': [
    img('1620712943543-bcc4688e7485'), // abstract AI / neural visualization
    img('1504868584819-f8e8b4b6d7e3'), // laptop with data/analytics on screen
    img('1517694712202-14dd9538aa97'), // code on monitor
  ],
  'Data Analytics': [
    img('1460925895917-afdab827c52f'), // laptop with analytics chart
    img('1522071820081-009f0129c71c'), // data chart close-up
    img('1551288049-bebda4e38f71'), // dashboard on screen
  ],
  'Product Design': [
    img('1454165804606-c3d57bc86b40'), // designer desk flat-lay with sketches
    img('1553877522-43269d4ea984'), // team collaborating on design
    img('1557838923-2985c318be48'), // UI design mockup on screen
  ],
  'Digital Marketing': [
    img('1533750349088-cd871a92f312'), // phone with social apps
    img('1460574283810-2aab119d8511'), // planning/writing at a desk
    img('1531403009284-440f080d1e12'), // laptop content work
  ],
};

const FALLBACK_IMAGES = [img('1519389950473-47ba0277781c')];

// Deterministic pick so the same course/project always gets the same image across reseeds,
// while still varying within a category instead of every card looking identical.
function pickImage(category, seedKey) {
  const pool = CATEGORY_IMAGES[category] || FALLBACK_IMAGES;
  let hash = 0;
  for (const char of seedKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}

// Projects don't carry a `category` field the way courses do, so map each explicitly -
// safer than inferring from skill names, since a skill like "Python" alone is ambiguous
// between the AI/ML and Data Analytics categories depending on the project's actual focus.
const PROJECT_CATEGORY_BY_SLUG = {
  'personal-portfolio': 'Web Development',
  'task-management-application': 'Web Development',
  'full-stack-ecommerce-application': 'Web Development',
  'house-price-prediction-model': 'AI & Machine Learning',
  'image-classification-model': 'AI & Machine Learning',
  'ai-question-answering-application': 'AI & Machine Learning',
  'mobile-banking-app-redesign': 'Product Design',
  'ecommerce-checkout-redesign': 'Product Design',
  'saas-product-design': 'Product Design',
  'sales-performance-dashboard': 'Data Analytics',
  'customer-churn-analysis': 'Data Analytics',
  'business-intelligence-dashboard': 'Data Analytics',
  'seo-strategy': 'Digital Marketing',
  'social-media-campaign': 'Digital Marketing',
  'complete-digital-marketing-campaign': 'Digital Marketing',
};

export { pickImage, PROJECT_CATEGORY_BY_SLUG };
