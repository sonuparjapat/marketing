const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
  related_case_studies: Pick<CaseStudy, 'id' | 'title' | 'slug' | 'client_name' | 'results_json' | 'cover_image'>[];
};

export type CaseStudyResult = { metric: string; value: string; label: string };

export type CaseStudy = {
  id: number;
  title: string;
  slug: string;
  client_name: string;
  client_industry: string;
  results_json: CaseStudyResult[];
  cover_image: string | null;
  tags: string[];
  is_featured: boolean;
};

export type CaseStudyDetail = CaseStudy & {
  challenge: string | null;
  solution: string | null;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export type Testimonial = {
  id: number;
  client_name: string;
  client_designation: string | null;
  client_company: string | null;
  client_photo: string | null;
  rating: number;
  review: string;
  is_featured: boolean;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: string;
  tags: string[];
  author: string;
  views: number;
  created_at: string;
};

export type PostDetail = Post & {
  content: string;
  related: Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image'>[];
};

export type TeamMember = {
  id: number;
  name: string;
  designation: string | null;
  bio: string | null;
  photo: string | null;
  linkedin_url: string | null;
};

export type PublicSettings = Record<string, string>;

export type NavLink = { id: number; label: string; href: string; location: string; sort_order: number };
export type NavLinks = { header: NavLink[]; footer: NavLink[] };

export type HomepageStat = { id: number; value: string; label: string };
export type WhyUsPoint = { id: number; point: string };
export type ClientLogo = { id: number; name: string; logo_url: string | null };
export type Faq = { id: number; question: string; answer: string; category: string };
export type Page = {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
};
export type HomepageSection = { id: number; section_key: string; is_enabled: boolean; sort_order: number };

async function fetchApi<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  const json = await res.json();
  return json.data as T;
}

export const getServices = () => fetchApi<Service[]>('/services').catch(() => []);
export const getService = (slug: string) => fetchApi<ServiceDetail>(`/services/${slug}`).catch(() => null);

export const getCaseStudies = (query = '') => fetchApi<CaseStudy[]>(`/case-studies${query}`).catch(() => []);
export const getCaseStudy = (slug: string) => fetchApi<CaseStudyDetail>(`/case-studies/${slug}`).catch(() => null);

export const getTestimonials = () => fetchApi<Testimonial[]>('/testimonials').catch(() => []);

export const getPosts = (query = '') =>
  fetchApi<{ items: Post[]; total: number }>(`/posts${query}`).catch(() => ({ items: [], total: 0 }));
export const getPost = (slug: string) => fetchApi<PostDetail>(`/posts/${slug}`, 0).catch(() => null);

export const getTeam = () => fetchApi<TeamMember[]>('/team').catch(() => []);

export const getPublicSettings = () =>
  fetchApi<PublicSettings>('/settings/public').catch(() => ({} as PublicSettings));

export const getNavLinks = () =>
  fetchApi<NavLinks>('/nav-links').catch(() => ({ header: [], footer: [] } as NavLinks));
export const getHomepageStats = () => fetchApi<HomepageStat[]>('/homepage-stats').catch(() => []);
export const getWhyUs = () => fetchApi<WhyUsPoint[]>('/why-us').catch(() => []);
export const getClientLogos = () => fetchApi<ClientLogo[]>('/client-logos').catch(() => []);
export const getFaqs = (category?: string) =>
  fetchApi<Faq[]>(`/faqs${category ? `?category=${encodeURIComponent(category)}` : ''}`).catch(() => []);
export const getPage = (slug: string) => fetchApi<Page>(`/pages/${slug}`).catch(() => null);
export const getHomepageSections = () => fetchApi<HomepageSection[]>('/homepage-sections').catch(() => []);

export function sectionsMap(sections: HomepageSection[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const s of sections) map[s.section_key] = s.is_enabled;
  return map;
}
