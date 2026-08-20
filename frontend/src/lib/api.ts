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
  cover_image_alt: string | null;
  category: string;
  tags: string[];
  author: string;
  views: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
};

export type PostDetail = Post & {
  content: string | null;
  author_id: number | null;
  author_name: string | null;
  author_photo: string | null;
  author_designation: string | null;
  author_bio: string | null;
  author_linkedin_url: string | null;
  related: Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'cover_image' | 'cover_image_alt'>[];
  like_count: number;
  dislike_count: number;
  my_vote: 'like' | 'dislike' | null;
  locked: boolean;
  required_service_label: string | null;
};

export type BlogCategory = { id: number; name: string; slug: string; sort_order: number };

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
export type Banner = {
  id: number;
  tag_label: string | null;
  title: string;
  subtitle: string | null;
  image_url: string;
  button_label: string | null;
  button_link: string | null;
  placement: 'hero' | 'promo';
};
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
  fetchApi<{ items: Post[]; total: number; page: number; limit: number }>(`/posts${query}`).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    limit: 9,
  }));
export const getPost = (slug: string) => fetchApi<PostDetail>(`/posts/${slug}`, 0).catch(() => null);

/** Every published post, paginating through the API's 50-per-page cap — for the sitemap, which needs the full set. */
export async function getAllPosts(): Promise<Post[]> {
  const all: Post[] = [];
  let page = 1;
  for (;;) {
    const res = await getPosts(`?page=${page}&limit=50`);
    all.push(...res.items);
    if (all.length >= res.total || !res.items.length) break;
    page += 1;
  }
  return all;
}
export const getBlogCategories = () => fetchApi<BlogCategory[]>('/blog-categories').catch(() => []);
export type PostTag = { tag: string; count: number };
export const getTags = () => fetchApi<PostTag[]>('/posts/tags').catch(() => []);

export const getTeam = () => fetchApi<TeamMember[]>('/team').catch(() => []);

export const getPublicSettings = () =>
  fetchApi<PublicSettings>('/settings/public').catch(() => ({} as PublicSettings));

export const getNavLinks = () =>
  fetchApi<NavLinks>('/nav-links').catch(() => ({ header: [], footer: [] } as NavLinks));
export const getHomepageStats = () => fetchApi<HomepageStat[]>('/homepage-stats').catch(() => []);
export const getWhyUs = () => fetchApi<WhyUsPoint[]>('/why-us').catch(() => []);
export const getClientLogos = () => fetchApi<ClientLogo[]>('/client-logos').catch(() => []);
export type PostComment = {
  id: number;
  content: string;
  created_at: string;
  customer_name: string;
  parent_id: number | null;
  reply_to_id: number | null;
  reply_to_name: string | null;
  like_count: number;
  dislike_count: number;
  my_vote: 'like' | 'dislike' | null;
};
export const getComments = (slug: string) => fetchApi<PostComment[]>(`/comments/${slug}`, 0).catch(() => []);
export const getBanners = (placement: 'hero' | 'promo' = 'hero') =>
  fetchApi<Banner[]>(`/banners?placement=${placement}`).catch(() => []);
export const getFaqs = (category?: string) =>
  fetchApi<Faq[]>(`/faqs${category ? `?category=${encodeURIComponent(category)}` : ''}`).catch(() => []);
export const getPage = (slug: string) => fetchApi<Page>(`/pages/${slug}`).catch(() => null);
export const getHomepageSections = () => fetchApi<HomepageSection[]>('/homepage-sections').catch(() => []);

export function sectionsMap(sections: HomepageSection[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const s of sections) map[s.section_key] = s.is_enabled;
  return map;
}
