import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts, getBlogCategories } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical notes on performance marketing, SEO and building D2C brands in India.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { category, q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);

  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (q) query.set('search', q);
  query.set('page', String(page));

  const [{ items: posts, total, limit }, categories] = await Promise.all([
    getPosts(`?${query.toString()}`),
    getBlogCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showFeatured = page === 1 && !category && !q;
  const [featured, ...rest] = showFeatured ? posts : [undefined, ...posts];

  const pageHref = (n: number) => {
    const p = new URLSearchParams(query);
    p.set('page', String(n));
    return `/blog?${p.toString()}`;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog',
    url: `${siteUrl}/blog`,
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[1312px]">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-accent">From the desk</span>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl font-normal leading-tight md:text-[50px]">
              Notes on building &amp; growing D2C.
            </h1>
          </div>
          <form action="/blog" method="get" className="w-full max-w-xs">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search posts…"
              className="w-full rounded-lg border border-line-soft bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
          </form>
        </div>

        {categories.length > 0 && (
          <div className="mb-14 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-wide transition-all ${!category ? 'bg-accent text-bg' : 'border border-line-soft text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent'}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/blog?category=${encodeURIComponent(c.name)}`}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-wide transition-all ${category === c.name ? 'bg-accent text-bg' : 'border border-line-soft text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent'}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group glass mb-14 grid gap-8 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/35 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden bg-bg2">
              {featured.cover_image ? (
                <Image
                  src={featured.cover_image}
                  alt={featured.cover_image_alt || featured.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="600px"
                />
              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  style={{
                    background:
                      'radial-gradient(120% 100% at 15% 10%, oklch(0.42 0.09 85 / 0.9), transparent 60%), radial-gradient(90% 80% at 90% 90%, oklch(0.55 0.11 300 / 0.5), transparent 60%), linear-gradient(150deg, oklch(0.22 0.04 85), oklch(0.16 0.028 265))',
                  }}
                >
                  <svg className="blog-chart" viewBox="0 0 200 90" preserveAspectRatio="none">
                    <path d="M0,55 L28,48 L56,50 L84,32 L112,38 L140,20 L168,26 L200,10" fill="none" stroke="oklch(1 0 0 / 0.5)" strokeWidth={2} />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <span className="text-[11px] uppercase tracking-wider text-accent">{featured.category}</span>
              <h2 className="mt-3 font-serif text-3xl font-normal leading-tight group-hover:text-accent md:text-[34px]">
                {featured.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{featured.excerpt}</p>
              <div className="mt-6 flex items-center gap-3 text-xs text-faint">
                <span>{featured.author}</span>
                <span>&middot;</span>
                <span>{new Date(featured.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {rest
            .filter((post): post is NonNullable<typeof post> => Boolean(post))
            .map((post, i) => {
              const hue = (['85', '165', '25'] as const)[i % 3];
              return (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                  <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl border border-line-soft bg-bg2">
                    {post.cover_image ? (
                      <Image
                        src={post.cover_image}
                        alt={post.cover_image_alt || post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="360px"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        style={{
                          background: `radial-gradient(120% 100% at 15% 10%, oklch(0.42 0.09 ${hue} / 0.9), transparent 60%), radial-gradient(90% 80% at 90% 90%, oklch(0.55 0.11 300 / 0.5), transparent 60%), linear-gradient(150deg, oklch(0.22 0.04 ${hue}), oklch(0.16 0.028 265))`,
                        }}
                      >
                        <svg className="blog-chart" viewBox="0 0 200 90" preserveAspectRatio="none">
                          <path
                            d="M0,50 L28,52 L56,34 L84,38 L112,20 L140,26 L168,14 L200,18"
                            fill="none"
                            stroke="oklch(1 0 0 / 0.5)"
                            strokeWidth={2}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
                  <h2 className="mt-2.5 text-[19px] font-semibold leading-snug group-hover:text-accent">{post.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                </Link>
              );
            })}
        </div>

        {!posts.length && (
          <p className="text-sm text-faint">
            {q || category ? 'No posts match — try a different search or category.' : 'Posts will appear here once published.'}
          </p>
        )}

        {totalPages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-2">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page === 1}
              className={`rounded-lg px-4 py-2 text-xs uppercase tracking-wide transition-all ${page === 1 ? 'pointer-events-none border border-line-soft text-faint' : 'border border-line-soft text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent'}`}
            >
              Previous
            </Link>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs transition-all ${n === page ? 'bg-accent font-bold text-bg' : 'border border-line-soft text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent'}`}
              >
                {n}
              </Link>
            ))}
            <Link
              href={pageHref(Math.min(totalPages, page + 1))}
              aria-disabled={page === totalPages}
              className={`rounded-lg px-4 py-2 text-xs uppercase tracking-wide transition-all ${page === totalPages ? 'pointer-events-none border border-line-soft text-faint' : 'border border-line-soft text-muted hover:-translate-y-0.5 hover:border-accent hover:text-accent'}`}
            >
              Next
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
