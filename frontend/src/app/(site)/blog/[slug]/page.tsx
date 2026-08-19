import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/api';
import { extractHeadings } from '@/lib/toc';
import { highlightCodeBlocks } from '@/lib/highlightCode';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { ShareButtons } from '@/components/ShareButtons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.cover_image ? [post.cover_image] : undefined,
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { html: withIds, headings } = extractHeadings(post.content);
  const html = highlightCodeBlocks(withIds);
  const wordCount = post.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image || undefined,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.created_at,
    dateModified: post.created_at,
    wordCount,
  };

  return (
    <main className="px-6 pb-24 pt-6 md:px-16">
      <ReadingProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-[720px] pt-14">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All posts
        </Link>

        <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
        <h1 className="mb-5 mt-3 font-serif text-3xl font-normal leading-tight md:text-[42px]">{post.title}</h1>

        <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-faint">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg2 text-xs font-bold text-accent">
            {post.author.charAt(0)}
          </div>
          <span className="text-fg">{post.author}</span>
          <span>&middot;</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
          <span>&middot;</span>
          <span>{post.views} views</span>
        </div>

        {post.cover_image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden border border-line bg-bg2">
            <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="720px" priority />
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-[960px] gap-10 lg:grid-cols-[720px_1fr]">
        <div
          className="prose prose-lg max-w-none [&_pre]:bg-bg2 [&_img]:border [&_img]:border-line"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {headings.length > 1 && (
          <aside className="hidden lg:block">
            <div className="sticky top-28 border-l border-line pl-6">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">On this page</div>
              <nav className="space-y-2.5 text-[13px]">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-muted hover:text-accent ${h.level === 3 ? 'pl-3' : ''}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      <div className="mx-auto max-w-[720px]">
        <div className="mt-14 border-t border-line pt-8">
          <ShareButtons title={post.title} url={postUrl} />
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="border border-line px-3 py-1 text-xs text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

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
