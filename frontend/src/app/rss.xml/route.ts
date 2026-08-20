import { getAllPosts, getPublicSettings } from '@/lib/api';

// XML entity escaping — post titles/excerpts are free-text and must not break the feed if they
// contain &, <, >, quotes, or an apostrophe.
function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const [posts, settings] = await Promise.all([getAllPosts(), getPublicSettings()]);
  const agencyName = settings.agency_name || 'Anvil Digital';

  const items = posts
    .slice(0, 50)
    .map(
      (p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${siteUrl}/blog/${p.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
      <description>${esc(p.excerpt || '')}</description>
      <category>${esc(p.category)}</category>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(agencyName)} Blog</title>
    <link>${siteUrl}/blog</link>
    <description>${esc(settings.default_meta_description || 'Practical notes on performance marketing, SEO and building D2C brands in India.')}</description>
    <language>en-in</language>${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
