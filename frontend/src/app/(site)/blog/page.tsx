import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical notes on performance marketing, SEO and building D2C brands in India.',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (q) query.set('search', q);

  const [{ items: posts }, { items: allPosts }] = await Promise.all([
    getPosts(query.toString() ? `?${query.toString()}` : ''),
    getPosts(),
  ]);

  const categories = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];
  const [featured, ...rest] = posts;

  return (
    <main className="px-6 py-24 md:px-16">
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
              className="w-full border border-line bg-bg2 px-4 py-3 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
            />
          </form>
        </div>

        {categories.length > 0 && (
          <div className="mb-14 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`px-4 py-2 text-xs uppercase tracking-wide ${!category ? 'bg-accent text-bg' : 'border border-line text-muted hover:border-accent hover:text-accent'}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/blog?category=${encodeURIComponent(c)}`}
                className={`px-4 py-2 text-xs uppercase tracking-wide ${category === c ? 'bg-accent text-bg' : 'border border-line text-muted hover:border-accent hover:text-accent'}`}
              >
                {c}
              </Link>
            ))}
          </div>
        )}

        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group mb-14 grid gap-8 border border-line md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden bg-bg2">
              {featured.cover_image && (
                <Image src={featured.cover_image} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="600px" />
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

        <div className="grid gap-10 md:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="relative mb-5 aspect-[4/3] overflow-hidden border border-line bg-bg2">
                {post.cover_image && (
                  <Image src={post.cover_image} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="360px" />
                )}
              </div>
              <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
              <h2 className="mt-2.5 text-[19px] font-semibold leading-snug group-hover:text-accent">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
            </Link>
          ))}
        </div>

        {!posts.length && (
          <p className="text-sm text-faint">
            {q || category ? 'No posts match — try a different search or category.' : 'Posts will appear here once published.'}
          </p>
        )}
      </div>
    </main>
  );
}
