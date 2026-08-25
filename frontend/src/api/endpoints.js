import { api } from './client.js';

function toQueryString(params = {}) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (usable.length === 0) return '';
  return `?${new URLSearchParams(usable).toString()}`;
}

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const onboardingApi = {
  getOptions: () => api.get('/onboarding/options'),
  submit: (data) => api.post('/onboarding', data),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  updateSkills: (skillIds) => api.put('/users/me/skills', { skillIds }),
};

export const goalsApi = {
  list: () => api.get('/goals'),
};

export const skillsApi = {
  list: (search) => api.get(`/skills${toQueryString({ search })}`),
};

export const coursesApi = {
  list: (params) => api.get(`/courses${toQueryString(params)}`),
  categories: () => api.get('/courses/categories'),
  getBySlug: (slug) => api.get(`/courses/${slug}`),
  curriculum: (slug) => api.get(`/courses/${slug}/curriculum`),
  related: (slug) => api.get(`/courses/${slug}/related`),
  reviews: (slug) => api.get(`/courses/${slug}/reviews`),
  addReview: (slug, data) => api.post(`/courses/${slug}/reviews`, data),
};

export const lessonsApi = {
  get: (id) => api.get(`/lessons/${id}`),
  complete: (id) => api.post(`/lessons/${id}/complete`),
};

export const enrollmentsApi = {
  mine: () => api.get('/enrollments/me'),
  enroll: (courseId) => api.post('/enrollments', { courseId }),
};

export const journeysApi = {
  list: (params) => api.get(`/journeys${toQueryString(params)}`),
  similar: () => api.get('/journeys/similar'),
  getBySlug: (slug) => api.get(`/journeys/${slug}`),
  follow: (slug) => api.post(`/journeys/${slug}/follow`),
  unfollow: (slug) => api.post(`/journeys/${slug}/unfollow`),
  resume: (slug) => api.post(`/journeys/${slug}/resume`),
  toggleSave: (slug) => api.post(`/journeys/${slug}/save`),
  saved: () => api.get('/journeys/me/saved'),
};

export const learningPathApi = {
  mine: () => api.get('/learning-path/me'),
  skip: (courseId) => api.post(`/learning-path/skip/${courseId}`),
};

export const projectsApi = {
  list: (params) => api.get(`/projects${toQueryString(params)}`),
  mine: () => api.get('/projects/me'),
  getBySlug: (slug) => api.get(`/projects/${slug}`),
  start: (id) => api.post(`/projects/${id}/start`),
  complete: (id) => api.post(`/projects/${id}/complete`),
};

export const assessmentsApi = {
  list: () => api.get('/assessments'),
  getBySlug: (slug) => api.get(`/assessments/${slug}`),
  submit: (slug, answers) => api.post(`/assessments/${slug}/submit`, { answers }),
  myResults: () => api.get('/assessments/results/me'),
};

export const progressApi = {
  mine: () => api.get('/progress/me'),
};

export const notificationsApi = {
  mine: () => api.get('/notifications/me'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const searchApi = {
  search: (q) => api.get(`/search${toQueryString({ q })}`),
};

export const dashboardApi = {
  mine: () => api.get('/dashboard/me'),
};
