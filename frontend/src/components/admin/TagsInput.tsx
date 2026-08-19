'use client';

import { useState, type KeyboardEvent } from 'react';

export function TagsInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-line bg-bg2 px-2.5 py-2 focus-within:border-accent">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1.5 bg-bg px-2 py-1 text-xs">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-faint hover:text-red-400"
            aria-label={`Remove ${tag}`}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length ? '' : 'Add tags, press Enter'}
        className="min-w-[100px] flex-1 bg-transparent py-1 text-sm text-fg placeholder:text-faint focus:outline-none"
      />
    </div>
  );
}
