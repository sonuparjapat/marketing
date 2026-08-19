'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Skeleton } from '@/components/Skeleton';

type SectionRow = { id: number; section_key: string; is_enabled: boolean; sort_order: number };

const LABELS: Record<string, string> = {
  hero: 'Hero',
  logos: 'Client logo strip',
  services: 'Services grid',
  stats: 'Stats counter',
  case_studies: 'Case studies',
  why_us: 'Why choose us',
  testimonials: 'Testimonials',
  blog: 'Blog preview',
  cta: 'CTA banner',
};

export default function AdminHomepageSectionsPage() {
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('homepage_sections.update');
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    apiClient
      .get('/admin/homepage-sections')
      .then((res) => setSections(res.data.data.items))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (section: SectionRow) => {
    const next = !section.is_enabled;
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, is_enabled: next } : s)));
    try {
      await apiClient.patch(`/admin/homepage-sections/${section.id}`, { is_enabled: next });
      show(`${LABELS[section.section_key] || section.section_key} ${next ? 'enabled' : 'hidden'}.`);
    } catch {
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, is_enabled: !next } : s)));
      show('Something went wrong.', 'error');
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-3 font-serif text-2xl">Homepage Sections</h1>
      <p className="mb-8 text-sm text-muted">
        Show or hide sections on the homepage. Order is fixed — content for each section is managed on its own
        page (Homepage Stats, Why Us, Client Logos, etc.).
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="border border-line">
          {sections.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
              <span className="text-[15px]">{LABELS[s.section_key] || s.section_key}</span>
              <button
                onClick={() => toggle(s)}
                disabled={!canUpdate}
                className={`h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${s.is_enabled ? 'bg-accent' : 'bg-line'}`}
                aria-pressed={s.is_enabled}
              >
                <span
                  className={`block h-5 w-5 translate-x-0.5 rounded-full bg-bg transition-transform ${
                    s.is_enabled ? 'translate-x-[22px]' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
