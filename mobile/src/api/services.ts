import api from './client';
import customerApi from './customerClient';

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
  cover_image_alt: string | null;
  category: string;
  author: string;
  is_premium: boolean;
  created_at: string;
};

export type PostDetail = Post & {
  content: string | null;
  author_photo: string | null;
  author_designation: string | null;
  related: Pick<Post, 'id' | 'title' | 'slug' | 'cover_image' | 'cover_image_alt'>[];
  locked: boolean;
  required_service_label: string | null;
};

export type Faq = { id: number; question: string; answer: string; category: string };

export const getFaqs = (category?: string) =>
  api
    .get<{ success: true; data: Faq[] }>(`/faqs${category ? `?category=${encodeURIComponent(category)}` : ''}`)
    .then((r) => r.data.data);

export const getPublicSettings = () =>
  api.get<{ success: true; data: Record<string, string> }>('/settings/public').then((r) => r.data.data);

export const getServices = () => api.get<{ success: true; data: Service[] }>('/services').then((r) => r.data.data);
export const getService = (slug: string) =>
  api.get<{ success: true; data: ServiceDetail }>(`/services/${slug}`).then((r) => r.data.data);

export const getCaseStudies = () =>
  api.get<{ success: true; data: CaseStudy[] }>('/case-studies').then((r) => r.data.data);
export const getCaseStudy = (slug: string) =>
  api.get<{ success: true; data: CaseStudyDetail }>(`/case-studies/${slug}`).then((r) => r.data.data);

export const getPosts = (category?: string) =>
  api
    .get<{ success: true; data: { items: Post[]; total: number } }>(
      `/posts${category ? `?category=${encodeURIComponent(category)}` : ''}`
    )
    .then((r) => r.data.data);

export type BlogCategory = { id: number; name: string; slug: string };
export const getBlogCategories = () =>
  api.get<{ success: true; data: BlogCategory[] }>('/blog-categories').then((r) => r.data.data);
export const getPost = (slug: string) =>
  api.get<{ success: true; data: PostDetail }>(`/posts/${slug}`).then((r) => r.data.data);

// Companion to getPost, mirroring the web's client-side re-check: `api` never carries a customer
// identity (it attaches the admin token, if any), so a premium post always comes back
// `locked: true` from getPost. This uses the customer-authenticated client to fetch the real
// content once CustomerAuthContext confirms who's signed in.
export const getPostFullContent = (slug: string) =>
  customerApi.get<{ success: true; data: { content: string } }>(`/posts/${slug}/full-content`).then((r) => r.data.data.content);

export const submitLead = (payload: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  service_interested?: string;
  budget_range?: string;
  source?: string;
}) => api.post('/leads', { ...payload, source: payload.source || 'mobile-app' }).then((r) => r.data);
