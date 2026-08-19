import { createLowlight, common } from 'lowlight';
import { toHtml } from 'hast-util-to-html';

const lowlight = createLowlight(common);

function decodeEntities(text: string) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * TipTap's CodeBlockLowlight only highlights live inside the editor (via ProseMirror
 * decorations) — the HTML it saves is plain, unhighlighted text. This re-highlights
 * `<pre><code class="language-x">` blocks at render time so published posts show
 * proper syntax-highlighted code regardless of where the HTML came from.
 */
export function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (match, lang: string | undefined, code: string) => {
      const raw = decodeEntities(code);
      if (!lang || !lowlight.registered(lang)) return match;
      try {
        const tree = lowlight.highlight(lang, raw);
        const highlighted = toHtml(tree);
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      } catch {
        return match;
      }
    }
  );
}
