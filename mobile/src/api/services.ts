import api from './client';

export type Service = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  icon: string;
  features_json: string[];
};

export type ServiceDetail = Service & {
  related_case_studies: Pick<CaseStudy, 'id' | 'title' | 'slug' | 'results_json'>[];
};

export type CaseStudy = {
  id: number;
  title: string;
  slug: string;
  client_name: string;
  client_industry: string;
  results_json: { metric: string; value: string; label: string }[];
  cover_image: string | null;
  is_featured: boolean;
};

export type CaseStudyDetail = CaseStudy & {
  challenge: string | null;
  solution: string | null;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: string;
  author: string;
  created_at: string;
};

export type PostDetail = Post & { content: string };

export const getServices = () => api.get<{ success: true; data: Service[] }>('/services').then((r) => r.data.data);
export const getService = (slug: string) =>
  api.get<{ success: true; data: ServiceDetail }>(`/services/${slug}`).then((r) => r.data.data);

export const getCaseStudies = () =>
  api.get<{ success: true; data: CaseStudy[] }>('/case-studies').then((r) => r.data.data);
export const getCaseStudy = (slug: string) =>
  api.get<{ success: true; data: CaseStudyDetail }>(`/case-studies/${slug}`).then((r) => r.data.data);

export const getPosts = () =>
  api.get<{ success: true; data: { items: Post[]; total: number } }>('/posts').then((r) => r.data.data);
export const getPost = (slug: string) =>
  api.get<{ success: true; data: PostDetail }>(`/posts/${slug}`).then((r) => r.data.data);

export const submitLead = (payload: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}) => api.post('/leads', { ...payload, source: payload.source || 'mobile-app' }).then((r) => r.data);
