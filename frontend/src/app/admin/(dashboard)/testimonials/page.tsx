'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

type TestimonialRow = {
  id: number;
  client_name: string;
  client_company: string;
  rating: number;
  customer_id: number | null;
  is_featured: boolean;
  is_active: boolean;
  is_approved: boolean;
};

export default function AdminTestimonialsPage() {
  return (
    <ResourceManager<TestimonialRow>
      title="Testimonials"
      apiPath="/admin/testimonials"
      columns={[
        { key: 'client_name', label: 'Name' },
        { key: 'client_company', label: 'Company' },
        { key: 'rating', label: 'Rating' },
        { key: 'customer_id', label: 'Source', render: (r) => (r.customer_id ? 'Customer review' : 'Admin') },
        { key: 'is_approved', label: 'Approved', render: (r) => (r.is_approved ? 'Yes' : 'Pending') },
        { key: 'is_featured', label: 'Featured', render: (r) => (r.is_featured ? 'Yes' : '') },
        { key: 'is_active', label: 'Active', render: (r) => (r.is_active ? 'Yes' : 'Hidden') },
      ]}
      fields={[
        { name: 'client_name', label: 'Client name', type: 'text' },
        { name: 'client_designation', label: 'Designation', type: 'text' },
        { name: 'client_company', label: 'Company', type: 'text' },
        { name: 'client_photo', label: 'Photo', type: 'image' },
        { name: 'rating', label: 'Rating (1-5)', type: 'number' },
        { name: 'review', label: 'Review', type: 'textarea' },
        { name: 'is_approved', label: 'Approved (visible on site)', type: 'boolean' },
        { name: 'is_featured', label: 'Featured', type: 'boolean' },
        { name: 'is_active', label: 'Active', type: 'boolean' },
      ]}
      emptyItem={{
        client_name: '',
        client_designation: '',
        client_company: '',
        client_photo: '',
        rating: 5,
        review: '',
        is_approved: true,
        is_featured: false,
        is_active: true,
      }}
    />
  );
}
