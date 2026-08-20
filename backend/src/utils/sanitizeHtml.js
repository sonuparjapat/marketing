const sanitizeHtml = require('sanitize-html');

// Allowlist matches exactly what the admin's TipTap editor can produce (RichTextEditor.tsx):
// headings, marks (bold/italic/underline/strike/highlight), links, images, tables, code blocks,
// text-align/color via inline style, and YouTube iframe embeds. Anything else — <script>, event
// handler attributes, javascript: URLs, arbitrary iframes — is stripped. This runs on every
// admin-submitted rich-text field before it's stored, since that HTML is later rendered on the
// public site via dangerouslySetInnerHTML for every visitor, not just re-shown to the admin who
// wrote it — unsanitized input there is a stored-XSS path to every visitor's browser and session.
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'mark', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    span: ['style', 'class'],
    p: ['style'],
    h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'],
    td: ['colspan', 'rowspan', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    code: ['class'],
    // youtube.com/embed only — allowedIframeHostnames below is the real enforcement, this just
    // permits the attributes a YouTube embed needs.
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'youtube-nocookie.com'],
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedStyles: {
    '*': {
      'text-align': [/^left$|^right$|^center$|^justify$/],
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
    },
  },
  // Strip disallowed tags but keep their text content (e.g. an unknown wrapper tag shouldn't
  // eat the paragraph it wraps).
  disallowedTagsMode: 'discard',
};

module.exports = function sanitizeRichHtml(html) {
  if (typeof html !== 'string' || !html) return html;
  return sanitizeHtml(html, OPTIONS);
};
