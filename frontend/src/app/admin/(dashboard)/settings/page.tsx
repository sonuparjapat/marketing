'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

const FIELDS: { key: string; label: string; group: string; type?: 'text' | 'color' }[] = [
  { key: 'agency_name', label: 'Agency name', group: 'General' },
  { key: 'tagline', label: 'Tagline', group: 'General' },
  { key: 'phone', label: 'Phone', group: 'General' },
  { key: 'email', label: 'Email', group: 'General' },
  { key: 'address', label: 'Address', group: 'General' },
  { key: 'whatsapp_number', label: 'WhatsApp number (with country code, digits only)', group: 'General' },
  { key: 'primary_color', label: 'Background color', group: 'Appearance', type: 'color' },
  { key: 'accent_color', label: 'Accent color', group: 'Appearance', type: 'color' },
  { key: 'instagram_url', label: 'Instagram URL', group: 'Social' },
  { key: 'linkedin_url', label: 'LinkedIn URL', group: 'Social' },
  { key: 'youtube_url', label: 'YouTube URL', group: 'Social' },
  { key: 'twitter_url', label: 'Twitter / X URL', group: 'Social' },
  { key: 'default_meta_title', label: 'Default SEO meta title pattern', group: 'SEO' },
  { key: 'default_meta_description', label: 'Default SEO meta description', group: 'SEO' },
  { key: 'ga_measurement_id', label: 'Google Analytics Measurement ID', group: 'SEO' },
  { key: 'agency_legal_name', label: 'Legal entity name (used on legal pages)', group: 'Legal' },
  { key: 'privacy_contact_email', label: 'Privacy contact email', group: 'Legal' },
  { key: 'notice_period', label: 'Cancellation notice period', group: 'Legal' },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/settings');
        const map: Record<string, string> = {};
        for (const row of res.data.data) map[row.key] = row.value || '';
        setValues(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all(
        FIELDS.map((f) => apiClient.put('/admin/settings', { key: f.key, value: values[f.key] || '' }))
      );
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-faint">Loading…</p>;

  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 font-serif text-2xl">Site Settings</h1>
      {groups.map((group) => (
        <div key={group} className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">{group}</h2>
          {group === 'Appearance' && (
            <p className="mb-5 text-xs text-faint">
              Changes here apply across the whole site the moment you save — no redeploy needed.
            </p>
          )}
          <div className="space-y-5">
            {FIELDS.filter((f) => f.group === group).map((f) => (
              <label key={f.key} className="block">
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">{f.label}</span>
                {f.type === 'color' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={isHex(values[f.key]) ? values[f.key] : '#000000'}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="h-10 w-14 cursor-pointer border border-line bg-bg2 p-1"
                    />
                    <input
                      type="text"
                      value={values[f.key] || ''}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1 border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-accent px-6 py-3 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-accent">Saved — refresh the site to see it live.</span>}
      </div>
    </div>
  );
}
