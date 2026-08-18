import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.created_at,
  };

  return (
    <main className="px-6 py-24 md:px-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-[720px]">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All posts
        </Link>

        <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
        <h1 className="mb-5 mt-3 font-serif text-3xl font-normal leading-tight md:text-[42px]">{post.title}</h1>

        {post.cover_image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden border border-line bg-bg2">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="720px" />
          </div>
        )}
        <div className="mb-12 flex items-center gap-3 text-sm text-faint">
          <span>{post.author}</span>
          <span>&middot;</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>&middot;</span>
          <span>{post.views} views</span>
        </div>

        <div
          className="prose-invert max-w-none text-[15.5px] leading-relaxed text-fg/90 [&>p]:mb-5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.related?.length > 0 && (
          <div className="mt-16 border-t border-line pt-10">
            <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-accent">Related reading</h2>
            <div className="grid gap-6">
              {post.related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="block text-[15px] font-semibold hover:text-accent">
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
