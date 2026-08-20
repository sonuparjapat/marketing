import type { MetadataRoute } from 'next';
import { getAllPosts, getCaseStudies, getServices } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const [posts, caseStudies, services] = await Promise.all([getAllPosts(), getCaseStudies(), getServices()]);

  const staticRoutes = ['', '/services', '/work', '/blog', '/about', '/contact', '/privacy-policy', '/terms', '/refund-policy'].map(
    (path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() })
  );

  // Real per-post freshness signal — previously every post claimed "just modified now," which is
  // noise, not a signal, for a crawler deciding re-crawl priority.
  const postRoutes = posts.map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: new Date(p.updated_at || p.created_at) }));
  const caseStudyRoutes = caseStudies.map((c) => ({ url: `${siteUrl}/work/${c.slug}`, lastModified: new Date() }));
  const serviceRoutes = services.map((s) => ({ url: `${siteUrl}/services/${s.slug}`, lastModified: new Date() }));

  return [...staticRoutes, ...postRoutes, ...caseStudyRoutes, ...serviceRoutes];
}
