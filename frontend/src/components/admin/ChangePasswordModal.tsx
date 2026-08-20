'use client';

import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const close = () => {
    setCurrentPassword('');
    setNewPassword('');
    onClose();
  };

  const onSave = async () => {
    if (newPassword.length < 8) {
      show('New password must be at least 8 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch('/admin/change-password', { currentPassword, newPassword });
      show('Password changed — please sign in again.');
      close();
      // Changing the password invalidates every session for this account, including this one —
      // send the admin straight to login instead of letting their next click surface a confusing 401.
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Change your password"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Change password
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <Input label="New password (min 8 characters)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
    </Modal>
  );
}
