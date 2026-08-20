'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { SectionInfo } from '@/components/admin/SectionInfo';

const FIELDS: { key: string; label: string; help: string; group: string; type?: 'text' | 'color' | 'string-array' }[] = [
  { key: 'agency_name', label: 'Agency name', help: 'Shown in the footer, browser tab title suffix, and legal pages.', group: 'General' },
  { key: 'tagline', label: 'Tagline', help: "The agency's one-line pitch — shown near the logo/footer wherever the site needs a short description.", group: 'General' },
  { key: 'phone', label: 'Phone', help: 'Shown on /contact and becomes the footer\'s click-to-call link.', group: 'General' },
  { key: 'email', label: 'Email', help: 'Shown on /contact and becomes the footer\'s click-to-email link — not the SMTP sender address (that\'s server config, not here).', group: 'General' },
  { key: 'address', label: 'Address', help: 'Shown on /contact and in the footer.', group: 'General' },
  { key: 'whatsapp_number', label: 'WhatsApp number (with country code, digits only)', help: 'Powers the floating WhatsApp chat button on the public site — e.g. 919876543210, no + or spaces.', group: 'General' },
  { key: 'budget_ranges', label: 'Contact form budget options (comma-separated)', help: 'The choices shown in the /contact form\'s budget dropdown, in the order typed here.', group: 'General', type: 'string-array' },
  { key: 'primary_color', label: 'Background color', help: 'The site-wide background color (--bg CSS variable) — applies live across every page the moment you save, no redeploy.', group: 'Appearance', type: 'color' },
  { key: 'accent_color', label: 'Accent color', help: 'The site-wide highlight color (--accent CSS variable) — buttons, links, and highlights everywhere.', group: 'Appearance', type: 'color' },
  { key: 'instagram_url', label: 'Instagram URL', help: 'Adds/updates the Instagram icon link in the footer. Leave blank to hide the icon entirely.', group: 'Social' },
  { key: 'linkedin_url', label: 'LinkedIn URL', help: 'Adds/updates the LinkedIn icon link in the footer. Leave blank to hide the icon entirely.', group: 'Social' },
  { key: 'youtube_url', label: 'YouTube URL', help: 'Adds/updates the YouTube icon link in the footer. Leave blank to hide the icon entirely.', group: 'Social' },
  { key: 'twitter_url', label: 'Twitter / X URL', help: 'Adds/updates the X icon link in the footer. Leave blank to hide the icon entirely.', group: 'Social' },
  { key: 'default_meta_title', label: 'Default SEO meta title pattern', help: 'The fallback browser-tab title used on any page that doesn\'t set its own — most content pages (posts, case studies) override this.', group: 'SEO' },
  { key: 'default_meta_description', label: 'Default SEO meta description', help: 'The fallback search-result snippet text for pages without their own meta description.', group: 'SEO' },
  { key: 'ga_measurement_id', label: 'Google Analytics Measurement ID', help: 'Your GA4 property ID (e.g. G-XXXXXXX). Analytics only loads after a visitor accepts the cookie-consent banner, and only if this is set.', group: 'SEO' },
  { key: 'agency_legal_name', label: 'Legal entity name (used on legal pages)', help: 'The registered company name shown on /privacy-policy, /terms, and /refund-policy.', group: 'Legal' },
  { key: 'privacy_contact_email', label: 'Privacy contact email', help: 'Shown on the legal pages as who to contact about data requests — can differ from the general contact email above.', group: 'Legal' },
  { key: 'notice_period', label: 'Cancellation notice period', help: 'Shown on /terms and /refund-policy as the required notice before cancelling a service.', group: 'Legal' },
];

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function jsonToCsv(raw: string | undefined) {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.join(', ') : raw;
  } catch {
    return raw;
  }
}

function csvToJson(csv: string) {
  const items = csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(items);
}

const STRING_ARRAY_KEYS = new Set(FIELDS.filter((f) => f.type === 'string-array').map((f) => f.key));

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { show } = useToast();
  const { hasPermission } = useAdminAuth();
  const canUpdate = hasPermission('settings.update');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/settings');
        const map: Record<string, string> = {};
        for (const row of res.data.data) {
          map[row.key] = STRING_ARRAY_KEYS.has(row.key) ? jsonToCsv(row.value) : row.value || '';
        }
        setValues(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    const results = await Promise.allSettled(
      FIELDS.map((f) => {
        const raw = values[f.key] || '';
        const value = STRING_ARRAY_KEYS.has(f.key) ? csvToJson(raw) : raw;
        return apiClient.put('/admin/settings', { key: f.key, value });
      })
    );
    setSaving(false);
    const failed = results
      .map((r, i) => (r.status === 'rejected' ? FIELDS[i].label : null))
      .filter((label): label is string => label !== null);
    if (failed.length) {
      show(`Failed to save: ${failed.join(', ')}`, 'error');
    } else {
      setSaved(true);
      show('Settings saved.');
    }
  };

  if (loading) return <p className="text-sm text-faint">Loading…</p>;

  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-serif text-2xl">Site Settings</h1>
      <SectionInfo
        description="Site-wide configuration that isn't tied to any one page — contact details, brand colors, social links, SEO defaults, and legal boilerplate. Everything here is read by multiple pages at once, so a change ripples across the whole site immediately on save."
        example={`your accent color feels dated. You pick a new one in Appearance and hit Save settings — every button, link, and highlight across the entire site updates to match, live, with no redeploy or code change.`}
      />
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
                <span className="mb-2 block text-xs uppercase tracking-wide text-muted">
                  {f.label}
                  <span className="mt-0.5 block text-[11px] font-normal normal-case tracking-normal text-faint">{f.help}</span>
                </span>
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
                ) : f.type === 'string-array' ? (
                  <input
                    type="text"
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder="Under ₹50k/month, ₹50k-1L/month, ₹1L+/month"
                    className="w-full border border-line bg-bg2 px-3.5 py-2.5 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
                  />
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
        {canUpdate ? (
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-accent px-6 py-3 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        ) : (
          <span className="text-sm text-faint">You don&apos;t have permission to change settings.</span>
        )}
        {saved && <span className="text-sm text-accent">Saved — refresh the site to see it live.</span>}
      </div>
    </div>
  );
}
