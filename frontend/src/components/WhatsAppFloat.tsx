import { WhatsappIcon } from './icons';

export function WhatsAppFloat({ number }: { number?: string }) {
  const digits = (number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.62_0.14_150)] shadow-lg shadow-black/40 transition-transform hover:scale-105"
    >
      <WhatsappIcon size={26} className="text-white" />
    </a>
  );
}
