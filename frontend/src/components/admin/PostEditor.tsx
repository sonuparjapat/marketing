'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploadField } from './ImageUploadField';
import { TagsInput } from './TagsInput';
import { SectionInfo } from './SectionInfo';

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  cover_image_alt: string;
  category: string;
  tags: string[];
  author: string;
  author_id: number | null;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  is_premium: boolean;
  required_service_id: number | null;
};

type Category = { id: number; name: string; slug: string };
type TeamMember = { id: number; name: string; designation: string; is_active: boolean };
type PremiumService = { id: number; label: string; is_active: boolean };

const EMPTY: Omit<Post, 'id'> = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  cover_image_alt: '',
  category: '',
  tags: [],
  author: 'Anvil Team',
  author_id: null,
  meta_title: '',
  meta_description: '',
  is_published: false,
  is_premium: false,
  required_service_id: null,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const canSave = hasPermission(postId ? 'posts.update' : 'posts.create');
  const [post, setPost] = useState<Omit<Post, 'id'>>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [guestAuthor, setGuestAuthor] = useState(false);
  const [services, setServices] = useState<PremiumService[]>([]);

  useEffect(() => {
    apiClient.get('/admin/blog-categories').then((res) => setCategories(res.data.data.items));
    apiClient.get('/admin/team', { params: { limit: 100 } }).then((res) => setTeam(res.data.data.items));
    apiClient.get('/admin/premium-services', { params: { limit: 100 } }).then((res) => setServices(res.data.data.items));
  }, []);

  useEffect(() => {
    if (!postId) return;
    apiClient
      .get(`/admin/posts/${postId}`)
      .then((res) => {
        setPost(res.data.data);
        setSlugTouched(true);
        setGuestAuthor(!res.data.data.author_id);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const update = <K extends keyof typeof post>(key: K, value: (typeof post)[K]) => {
    setDirty(true);
    setPost((p) => {
      const next = { ...p, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value as string);
      return next;
    });
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const words = useMemo(() => post.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length, [post.content]);
  const readingTime = Math.max(1, Math.round(words / 200));

  const save = async (publish?: boolean) => {
    if (!post.title.trim()) {
      show('Give the post a title first.', 'error');
      return;
    }
    if (post.is_premium && !post.required_service_id) {
      show('Pick a required service for this premium post.', 'error');
      return;
    }
    setSaving(true);
    const payload = { ...post, is_published: publish ?? post.is_published };
    try {
      if (postId) {
        await apiClient.put(`/admin/posts/${postId}`, payload);
        setPost(payload);
        show(publish === true ? 'Published.' : publish === false ? 'Unpublished.' : 'Saved.');
      } else {
        const res = await apiClient.post('/admin/posts', payload);
        show(payload.is_published ? 'Published.' : 'Draft saved.');
        router.replace(`/admin/posts/${res.data.data.id}/edit`);
        return;
      }
      setDirty(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      show(message || 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-faint">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/posts" className="text-sm text-muted hover:text-accent">
          &larr; All posts
        </Link>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-faint">Unsaved changes</span>}
          <span
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              post.is_published ? 'bg-accent text-bg' : 'bg-bg2 text-muted'
            }`}
          >
            {post.is_published ? 'Published' : 'Draft'}
          </span>
          {canSave && (
            <>
              <button
                onClick={() => save()}
                disabled={saving}
                className="border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent disabled:opacity-60"
              >
                Save draft
              </button>
              <button
                onClick={() => save(!post.is_published)}
                disabled={saving}
                className="bg-accent px-5 py-2 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : post.is_published ? 'Unpublish' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      {!postId && (
        <SectionInfo
          description="Writes and publishes a blog post shown on the public /blog listing and its own /blog/[slug] page. Nothing here goes live until you click Publish — Save draft keeps it invisible to visitors while you're still working on it."
          example={`you're writing a post about a new case study. You fill in the title, cover image, and content, click "Save draft" a few times while editing over a couple of days, then hit "Publish" when it's ready — it appears on /blog immediately.`}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="min-w-0">
          <input
            type="text"
            value={post.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Post title"
            className="mb-1 w-full border-0 bg-transparent font-serif text-4xl font-normal placeholder:text-faint focus:outline-none"
          />
          <p className="mb-3 text-[11px] text-faint">Shown as the page &lt;h1&gt;, the /blog card heading, and used to auto-generate the URL slug below.</p>
          <textarea
            value={post.excerpt}
            onChange={(e) => update('excerpt', e.target.value)}
            placeholder="One or two sentences that show up in previews and search results…"
            rows={2}
            className="mb-2 w-full resize-none border-0 bg-transparent text-[15px] italic text-muted placeholder:text-faint focus:outline-none"
          />
          <p className="mb-6 text-[11px] text-faint">Shown on the /blog listing card and used as the fallback search-result description — also what a premium post&apos;s paywall shows non-subscribers.</p>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-faint">Content — the full article body readers see on the post page.</p>
          <RichTextEditor value={post.content} onChange={(html) => update('content', html)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Publish</h3>
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Slug
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  The URL segment — auto-filled from the title until you edit it directly. Changing it after publishing breaks any external links pointing at the old URL.
                </span>
              </span>
              <input
                type="text"
                value={post.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  update('slug', slugify(e.target.value));
                }}
                className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <span className="mt-1.5 block truncate text-[11px] text-faint">
                {siteUrl}/blog/{post.slug || '…'}
              </span>
            </label>
            <div className="flex items-center justify-between text-xs text-faint">
              <span>{words} words</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Cover image</h3>
            <p className="mb-3 text-[11px] text-faint">Shown at the top of the post and as the thumbnail on the /blog listing and social share previews.</p>
            <ImageUploadField value={post.cover_image} onChange={(url) => update('cover_image', url)} />
            <label className="mt-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Alt text
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  Read aloud by screen readers and used by search engines — describe what&apos;s actually in the image, not the post topic.
                </span>
              </span>
              <input
                type="text"
                value={post.cover_image_alt}
                onChange={(e) => update('cover_image_alt', e.target.value)}
                placeholder="Describe the image for screen readers & SEO"
                className="w-full border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Organize</h3>
            <label className="mb-4 block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Category</span>
                <Link href="/admin/blog-categories" className="text-[11px] text-accent hover:opacity-80">
                  Manage categories
                </Link>
              </div>
              <p className="mb-2 -mt-1 text-[11px] text-faint">Determines which /blog filter chip this post appears under.</p>
              <select
                value={post.category}
                onChange={(e) => update('category', e.target.value)}
                className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                {post.category && !categories.some((c) => c.name === post.category) && (
                  <option value={post.category}>{post.category} (no longer in the list)</option>
                )}
              </select>
            </label>
            <label className="mb-4 block">
              <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                Tags
                <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">
                  Powers the tag-browsing chips and the &quot;did you mean&quot; suggestions on /blog — press Enter after each one.
                </span>
              </span>
              <TagsInput value={post.tags} onChange={(tags) => update('tags', tags)} />
            </label>
            <label className="block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Author</span>
                <button
                  type="button"
                  onClick={() => setGuestAuthor((v) => !v)}
                  className="text-[11px] text-accent hover:opacity-80"
                >
                  {guestAuthor ? 'Pick from team' : 'Guest author'}
                </button>
              </div>
              <p className="mb-2 -mt-1 text-[11px] text-faint">
                {guestAuthor
                  ? "A name-only byline, no photo/bio card — for a writer who isn't on the Team page."
                  : "Attributes this post to a Team member — their photo, bio, and LinkedIn appear in an author card at the end."}
              </p>
              {guestAuthor ? (
                <input
                  type="text"
                  value={post.author}
                  onChange={(e) => {
                    update('author', e.target.value);
                    update('author_id', null);
                  }}
                  className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              ) : (
                <select
                  value={post.author_id ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    update('author_id', id);
                    const member = team.find((t) => t.id === id);
                    if (member) update('author', member.name);
                  }}
                  className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Select a team member…</option>
                  {team.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.designation}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Premium</h3>
            <p className="mb-4 text-[11px] leading-relaxed text-faint">
              Gates the full article behind a subscription service. The title/excerpt/SEO stay public either way — only
              the article body (this post&apos;s Content field above) is withheld from non-subscribers.
            </p>
            <label className="mb-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted">Premium post</span>
              <input
                type="checkbox"
                checked={post.is_premium}
                onChange={(e) => update('is_premium', e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
            </label>
            {post.is_premium && (
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">Required service</span>
                <select
                  value={post.required_service_id ?? ''}
                  onChange={(e) => update('required_service_id', e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-line bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Select a service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-[11px] text-faint">
                  Only customers with an active plan that includes this service can read the full post.
                </span>
              </label>
            )}
          </div>

          <div className="border border-line bg-bg2 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">SEO</h3>
            <label className="mb-4 block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Meta title</span>
                <span className={`text-[11px] ${post.meta_title.length > 60 ? 'text-red-400' : 'text-faint'}`}>
                  {post.meta_title.length}/60
                </span>
              </div>
              <p className="mb-2 -mt-1 text-[11px] text-faint">
                The blue clickable line in Google search results and the browser tab title. Falls back to the post
                title above if left blank — only override it if you want the SEO title to differ from the on-page headline.
              </p>
              <input
                type="text"
                value={post.meta_title}
                onChange={(e) => update('meta_title', e.target.value)}
                placeholder={post.title}
                className="w-full border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
            <label className="mb-4 block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted">Meta description</span>
                <span className={`text-[11px] ${post.meta_description.length > 160 ? 'text-red-400' : 'text-faint'}`}>
                  {post.meta_description.length}/160
                </span>
              </div>
              <p className="mb-2 -mt-1 text-[11px] text-faint">
                The gray snippet text under the title in search results. Falls back to the Excerpt field above if left blank.
              </p>
              <textarea
                value={post.meta_description}
                onChange={(e) => update('meta_description', e.target.value)}
                placeholder={post.excerpt}
                rows={3}
                className="w-full resize-none border border-line bg-bg px-3 py-2 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </label>
            <div className="border border-line bg-bg p-3">
              <div className="truncate text-[13px] text-accent">
                {siteUrl}/blog/{post.slug || 'your-post'}
              </div>
              <div className="truncate text-[15px] text-[#8ab4f8]">{post.meta_title || post.title || 'Post title'}</div>
              <div className="line-clamp-2 text-[12.5px] text-muted">
                {post.meta_description || post.excerpt || 'Meta description preview…'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
