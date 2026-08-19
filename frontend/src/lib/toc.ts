export type Heading = { id: string; text: string; level: 2 | 3 };

function slugifyHeading(text: string, seen: Map<string, number>) {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  const count = seen.get(base) || 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/** Injects id="…" into every h2/h3 in the HTML and returns them for a table of contents. */
export function extractHeadings(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  const processed = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!text) return `<h${level}${attrs}>${inner}</h${level}>`;
    const id = slugifyHeading(text, seen);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: processed, headings };
}
