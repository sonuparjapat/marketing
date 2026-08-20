const sanitizeRichHtml = require('../../src/utils/sanitizeHtml');

describe('sanitizeRichHtml', () => {
  it('strips <script> tags entirely', () => {
    const out = sanitizeRichHtml('<p>Hello</p><script>alert(1)</script>');
    expect(out).not.toMatch(/script/i);
    expect(out).toContain('<p>Hello</p>');
  });

  it('strips inline event-handler attributes', () => {
    const out = sanitizeRichHtml('<p onclick="alert(1)">click me</p>');
    expect(out).not.toMatch(/onclick/i);
    expect(out).toContain('click me');
  });

  it('strips javascript: URLs from links', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">bad link</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it('keeps ordinary formatting the editor produces', () => {
    const out = sanitizeRichHtml('<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em>.</p>');
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<strong>Bold</strong>');
    expect(out).toContain('<em>italic</em>');
  });

  it('keeps a real link with a safe href', () => {
    const out = sanitizeRichHtml('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
  });

  it('keeps a YouTube embed iframe but drops an arbitrary one', () => {
    const good = sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/abc123"></iframe>');
    expect(good).toContain('youtube.com');

    const bad = sanitizeRichHtml('<iframe src="https://evil.example.com/payload"></iframe>');
    expect(bad).not.toContain('evil.example.com');
  });

  it('passes through non-string input unchanged', () => {
    expect(sanitizeRichHtml(null)).toBeNull();
    expect(sanitizeRichHtml(undefined)).toBeUndefined();
    expect(sanitizeRichHtml('')).toBe('');
  });
});
