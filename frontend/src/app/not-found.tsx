import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="font-serif-italic mb-4 text-[120px] leading-none text-bg2">404</span>
      <h1 className="mb-4 font-serif text-3xl font-normal">This page didn&apos;t make the funnel.</h1>
      <p className="mb-10 max-w-md text-[15px] leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Here are some places that do.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 bg-accent px-7 py-3.5 text-sm font-bold text-bg hover:opacity-90">
          Back to home <ArrowRightIcon size={16} />
        </Link>
        <Link href="/work" className="inline-flex items-center gap-2.5 border border-line px-7 py-3.5 text-sm hover:border-accent hover:text-accent">
          View our work
        </Link>
      </div>
    </main>
  );
}
