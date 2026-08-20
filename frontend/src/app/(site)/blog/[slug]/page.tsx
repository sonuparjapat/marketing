import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPost, getComments } from '@/lib/api';
import { extractHeadings } from '@/lib/toc';
import { highlightCodeBlocks } from '@/lib/highlightCode';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { ShareButtons } from '@/components/ShareButtons';
import { CommentSection } from '@/components/CommentSection';
import { PostVoteButtons } from '@/components/PostVoteButtons';

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
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, comments] = await Promise.all([getPost(slug), getComments(slug)]);
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
    author: { '@type': 'Person', name: post.author, url: post.author_linkedin_url || undefined },
    datePublished: post.created_at,
    dateModified: post.created_at,
    wordCount,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <main className="px-6 pb-24 pt-6 md:px-16">
      <ReadingProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mx-auto max-w-[720px] pt-14">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          &larr; All posts
        </Link>

        <span className="text-[11px] uppercase tracking-wider text-accent">{post.category}</span>
        <h1 className="mb-5 mt-3 font-serif text-3xl font-normal leading-tight md:text-[42px]">{post.title}</h1>

        <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-faint">
          {post.author_photo ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line bg-bg2">
              <Image src={post.author_photo} alt="" fill className="object-cover" sizes="32px" />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg2 text-xs font-bold text-accent">
              {post.author.charAt(0)}
            </div>
          )}
          <span className="text-fg">{post.author}</span>
          <span>&middot;</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
          <span>&middot;</span>
          <span>{post.views} views</span>
        </div>

        <div className="mb-10">
          <PostVoteButtons slug={slug} initialLikeCount={post.like_count} initialDislikeCount={post.dislike_count} />
        </div>

        {post.cover_image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-line-soft bg-bg2">
            <Image src={post.cover_image} alt={post.cover_image_alt || post.title} fill className="object-cover" sizes="720px" priority />
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

        {post.author_bio && (
          <div className="glass mt-12 flex gap-5 rounded-2xl p-6">
            {post.author_photo ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-bg">
                <Image src={post.author_photo} alt="" fill className="object-cover" sizes="64px" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-lg font-bold text-accent">
                {post.author.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-fg">{post.author}</p>
              {post.author_designation && <p className="text-xs text-faint">{post.author_designation}</p>}
              <p className="mt-2 text-sm leading-relaxed text-muted">{post.author_bio}</p>
              {post.author_linkedin_url && (
                <a href={post.author_linkedin_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent hover:opacity-80">
                  LinkedIn &rarr;
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {post.related?.length > 0 && (
        <div className="mx-auto mt-16 max-w-[960px] border-t border-line pt-10">
          <h2 className="mb-6 text-xs uppercase tracking-[0.2em] text-accent">Related reading</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {post.related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-line-soft bg-bg2">
                  {r.cover_image && (
                    <Image
                      src={r.cover_image}
                      alt={r.cover_image_alt || r.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="320px"
                    />
                  )}
                </div>
                <h3 className="text-[15px] font-semibold leading-snug group-hover:text-accent">{r.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CommentSection slug={slug} initialComments={comments} />
    </main>
  );
}
