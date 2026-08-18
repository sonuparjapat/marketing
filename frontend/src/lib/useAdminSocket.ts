'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAdminToken } from '@/lib/adminAuth';

let socket: Socket | null = null;

export function useAdminSocket(handlers: { onNewLead?: (data: unknown) => void; onNewCallback?: (data: unknown) => void }) {
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', { auth: { token } });
    }

    const onLead = (data: unknown) => handlers.onNewLead?.(data);
    const onCallback = (data: unknown) => handlers.onNewCallback?.(data);

    socket.on('new_lead', onLead);
    socket.on('new_callback', onCallback);

    return () => {
      socket?.off('new_lead', onLead);
      socket?.off('new_callback', onCallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
