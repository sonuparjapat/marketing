'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type TestimonialRow = {
  id: number;
  client_name: string;
  client_company: string;
  rating: number;
  customer_id: number | null;
  is_active: boolean;
  is_approved: boolean;
};

export default function AdminTestimonialsPage() {
  return (
    <ResourceManager<TestimonialRow>
      title="Testimonials"
      description="The full library of every review — written by an admin directly, or submitted by a signed-in customer through their account (which starts unapproved until you review it). This page is for writing/editing/approving review content. It does NOT control what shows on the homepage — that's a separate step on the Homepage Reviews page, so a low-quality review can be approved for the record without automatically going live."
      example="a customer submits a 5-star review from their account. It lands here with Approved off. You read it, fix a typo, flip Approved on — it's now a real, usable review, but it still won't appear on the homepage until you also add it on the Homepage Reviews page."
      apiPath="/admin/testimonials"
      columns={[
        { key: 'client_name', label: 'Name' },
        { key: 'client_company', label: 'Company' },
        { key: 'rating', label: 'Rating' },
        { key: 'customer_id', label: 'Source', render: (r) => (r.customer_id ? 'Customer review' : 'Admin') },
        { key: 'is_approved', label: 'Approved', render: (r) => (r.is_approved ? 'Yes' : 'Pending') },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'client_name', label: 'Client name', type: 'text', help: 'Shown as the reviewer\'s name wherever this testimonial appears.' },
        { name: 'client_designation', label: 'Designation', type: 'text', help: 'Their job title, e.g. "Founder" — shown under their name for admin-authored reviews (customer-submitted ones use the account name only).' },
        { name: 'client_company', label: 'Company', type: 'text', help: 'The brand/company they represent — adds credibility, shown alongside their name.' },
        { name: 'client_photo', label: 'Photo', type: 'image', help: 'Optional headshot or company logo shown next to the review. Falls back to a plain initial-letter avatar if left blank.' },
        { name: 'rating', label: 'Rating (1-5)', type: 'number', help: 'Shown as a star rating (e.g. ★★★★★) wherever the review appears.' },
        { name: 'review', label: 'Review', type: 'textarea', help: 'The testimonial text itself.' },
        { name: 'is_approved', label: 'Approved (visible on site)', type: 'boolean', help: 'A customer-submitted review starts unapproved and stays invisible to this whole feature until you turn this on — the moderation gate. Admin-authored reviews start pre-approved.' },
        { name: 'is_active', label: 'Active', type: 'boolean', help: 'A second, independent on/off switch from Approved — use this to temporarily retire a review (e.g. a client relationship ended) without losing the approval history.' },
      ]}
      emptyItem={{
        client_name: '',
        client_designation: '',
        client_company: '',
        client_photo: '',
        rating: 5,
        review: '',
        is_approved: true,
        is_active: true,
      }}
    />
  );
}
