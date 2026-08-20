'use client';

import { useState } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export function TwoFactorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { admin, refresh } = useAdminAuth();
  const { show } = useToast();
  const [step, setStep] = useState<'idle' | 'setup'>('idle');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep('idle');
    setQrCodeDataUrl('');
    setSecret('');
    setCode('');
    setPassword('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post('/admin/2fa/setup');
      setQrCodeDataUrl(res.data.data.qrCodeDataUrl);
      setSecret(res.data.data.secret);
      setStep('setup');
    } catch (err) {
      show(errMessage(err, 'Something went wrong.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    setBusy(true);
    try {
      await apiClient.post('/admin/2fa/verify', { code });
      show('Two-factor authentication is now enabled.');
      await refresh();
      close();
    } catch (err) {
      show(errMessage(err, 'Incorrect code.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await apiClient.post('/admin/2fa/disable', { password });
      show('Two-factor authentication disabled.');
      await refresh();
      close();
    } catch (err) {
      show(errMessage(err, 'Incorrect password.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (admin?.totp_enabled) {
    return (
      <Modal open={open} onClose={close} title="Two-factor authentication">
        <div className="space-y-5">
          <p className="text-sm text-muted">
            2FA is currently <span className="text-accent">enabled</span> on your account. Enter your password to
            turn it off.
          </p>
          <Input label="Current password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button onClick={disable} loading={busy} variant="danger" className="w-full border border-red-400/40">
            Disable 2FA
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title="Two-factor authentication">
      {step === 'idle' ? (
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Add a second step to your login using an authenticator app (Google Authenticator, Authy, 1Password, …).
          </p>
          <Button onClick={startSetup} loading={busy} className="w-full">
            Set up 2FA
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted">Scan this with your authenticator app, then enter the 6-digit code it shows.</p>
          {qrCodeDataUrl && (
            <div className="flex justify-center rounded-lg bg-white p-4">
              <Image src={qrCodeDataUrl} alt="2FA QR code" width={180} height={180} unoptimized />
            </div>
          )}
          <p className="break-all text-center text-xs text-faint">Manual entry key: {secret}</p>
          <Input
            label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          <Button onClick={confirmSetup} loading={busy} className="w-full">
            Verify & enable
          </Button>
        </div>
      )}
    </Modal>
  );
}
