import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Practical notes on performance marketing, SEO and building D2C brands in India.',
};

export default async function BlogPage() {
  const { items: posts } = await getPosts();

  return (
    <main className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-[1312px]">
        <span className="text-xs uppercase tracking-[0.2em] text-accent">From the desk</span>
        <h1 className="mt-3 mb-16 max-w-2xl font-serif text-4xl font-normal leading-tight md:text-[50px]">
          Notes on building &amp; growing D2C.
        </h1>

        <div className="grid gap-10 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="relative mb-5 aspect-[4/3] overflow-hidden border border-line bg-bg2">
                {post.cover_image && (
                  <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="360px" />
                )}
              </div>
              <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
              <h2 className="mt-2.5 text-[19px] font-semibold leading-snug group-hover:text-accent">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
            </Link>
          ))}
        </div>

        {!posts.length && <p className="text-sm text-faint">Posts will appear here once published.</p>}
      </div>
    </main>
  );
}
