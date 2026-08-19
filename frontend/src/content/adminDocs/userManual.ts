export const USER_MANUAL_HTML = `<h2>Welcome</h2>
<p>This is the complete guide to running the Anvil Digital website day-to-day — no coding knowledge needed. Everything you can change on the live site (text, images, blog posts, case studies, homepage layout, colors) is controlled from this admin panel.</p>
<p>If something doesn't match what you see on screen, this guide is the one to trust — it gets updated every time the admin panel changes.</p>

<h2>Logging in</h2>
<p>Go to <code>/admin/login</code> on the site (e.g. <code>https://youragency.com/admin/login</code>). Enter your email and password. Click the eye icon inside the password field if you want to check what you typed before submitting.</p>
<p>There are two account types:</p>
<ul>
<li><strong>Editor</strong> — can manage all content (blog, case studies, services, leads, homepage, etc.)</li>
<li><strong>Super Admin</strong> — everything an Editor can do, plus managing other admin accounts and site-wide Settings/Appearance</li>
</ul>
<p>If your account gets deactivated by a Super Admin, you'll see "This account has been deactivated" when trying to log in — ask a Super Admin to reactivate you from the Admins page.</p>

<h2>The Dashboard</h2>
<p>The first screen after login. It shows today's lead count, total leads, active newsletter subscribers, blog views this month, pending callbacks, and a table of the 5 most recent leads. This updates live — if someone submits the contact form while you're looking at the dashboard, the numbers refresh automatically and a small notification pops up.</p>

<h2>Leads (the Inbox)</h2>
<p>Every contact form submission lands here. Each lead has a status you move through a pipeline:</p>
<p><code>new</code> → <code>contacted</code> → <code>qualified</code> → <code>proposal</code> → <code>won</code> or <code>lost</code></p>
<p>Click <strong>View</strong> on any lead to see their full message, phone, company, and budget range, and to add internal notes only your team sees (never shown to the visitor). Change the status directly from the dropdown in the table — no need to open the detail view just to update status.</p>
<p>Filter by status using the dropdown at the top of the page. New leads trigger a real-time notification (a toast message and a badge count on "Inbox" in the sidebar) the instant someone submits the form — you don't need to refresh the page.</p>

<h2>Callbacks</h2>
<p>Separate from leads — these come from the "Request a callback" form (just name, phone, and a preferred time). Mark one as <strong>Called</strong> once you've followed up; you can toggle it back to Pending if needed.</p>

<h2>Subscribers</h2>
<p>Everyone who signed up for the newsletter via the footer form. Click <strong>Export CSV</strong> to download the full list (email, name, subscribed date) for use in an email tool like Mailchimp or Brevo.</p>

<h2>Writing a blog post</h2>
<p>Go to <strong>Blog</strong> in the sidebar, then <strong>+ New post</strong>. This opens a full-page editor, not a small popup — built to feel like Medium or Notion:</p>
<ul>
<li><strong>Title</strong> — the big text box at the top. Typing here automatically fills in the URL slug below (you can still edit the slug manually if you want a different URL).</li>
<li><strong>Excerpt</strong> — one or two sentences shown in blog previews and search results. Keep it short.</li>
<li><strong>Content</strong> — the main editor. Select any text to get a floating toolbar (bold, italic, underline, link). Use the toolbar above the editor for headings, lists, quotes, code blocks, text alignment, text color, tables, YouTube embeds, and inserting images. Word count and estimated reading time show at the bottom of the editor.</li>
</ul>
<p>On the right sidebar:</p>
<ul>
<li><strong>Publish card</strong> — shows the exact live URL your post will have, plus word count / reading time.</li>
<li><strong>Cover image</strong> — click Upload to add one, Replace to swap it for a different file, or Remove to clear it entirely. Add Alt text underneath — a short description of the image, used by screen readers and by Google Image search; don't skip this, it's a real SEO factor. This image shows on blog listing cards and at the top of the post.</li>
<li><strong>Organize</strong> — Category is a dropdown pulled from Admin → Blog Categories (click "Manage categories" right there in the editor to add a new one without losing your place); Tags (press Enter after each one); Author, which is either a real team member picked from a dropdown (their photo, title, and bio then appear on the published post automatically) or a one-off "Guest author" typed by hand — toggle between the two with the link next to the Author label.</li>
<li><strong>SEO</strong> — Meta title and meta description control how the post appears in Google search results and when shared on social media. A live preview box shows exactly how it'll look. Character counters turn red if you go over the recommended length (60 / 160 characters).</li>
</ul>
<p>Click <strong>Save draft</strong> to save without publishing (visitors can't see it yet), or <strong>Publish</strong> to make it live immediately. You can unpublish a live post any time — it goes back to draft, the page stops being publicly accessible, but nothing is deleted.</p>
<p>Back on the Blog list page, you can also toggle Published/Draft directly from the status pill in the table, search posts by title, and filter by category — without opening the editor. The public blog page now paginates automatically once there are more posts than fit on one page — nothing to configure.</p>

<h2>Case Studies</h2>
<p>Each case study needs: Title, Client name, Industry, a Challenge and Solution (both support the same rich text formatting as blog posts), a cover image, tags, and a <strong>Results</strong> field.</p>
<p>Results control the big stat numbers shown on the case study (e.g. "+218% Revenue"). This field expects a small JSON list — format:</p>
<pre><code class="language-json">[
  {"metric": "Revenue growth", "value": "+218%", "label": "12 months"},
  {"metric": "Blended ROAS", "value": "3.4x", "label": ""}
]</code></pre>
<p>Toggle <strong>Featured</strong> on to make a case study the large highlighted one on the homepage and Work page (only feature one at a time for the best effect). Toggle <strong>Published</strong> off to hide it without deleting.</p>

<h2>Services</h2>
<p>Each service has a Title, short/full description, an Icon (pick from the dropdown — a small fixed set of icons, matching what's built into the site), Features (a bullet list shown on the service detail page), and a Sort order number (lower numbers show first on the homepage and services page).</p>

<h2>Testimonials</h2>
<p>Client name, designation, company, photo, star rating, and the review text. Toggle <strong>Featured</strong> to control which ones appear first. Toggle <strong>Active</strong> off to hide one without deleting it.</p>

<h2>Team</h2>
<p>Name, designation, bio, photo, LinkedIn URL, and sort order. Shown on the About page.</p>

<h2>FAQs</h2>
<p>Question and answer pairs. The <strong>Category</strong> field controls where they appear:</p>
<ul>
<li>Set category to <code>general</code> to show on the general FAQ pool</li>
<li>Set category to a service's exact slug (e.g. <code>performance-marketing</code>) to show that FAQ specifically on that service's page — if a service page has no FAQs of its own, it automatically falls back to showing the general ones</li>
</ul>

<h2>Pages (About &amp; Legal)</h2>
<p>The About, Privacy Policy, Terms, and Refund Policy pages are edited here — click a page card, edit the rich text content, and Save. These four pages always exist (you can't delete them or add new ones from here), but you have full control over what they say.</p>

<h2>Homepage management</h2>
<p><strong>Sections</strong> — toggle any homepage section on/off with a switch (Hero, Client logos, Services, Stats, Case studies, Why us, Testimonials, Blog preview, CTA banner). The order is fixed, but visibility is fully up to you.</p>
<p><strong>Stats</strong> — the 4 big numbers in the stats bar (e.g. "50+ Brands scaled"). Add, edit, reorder with the sort order field.</p>
<p><strong>Why Us</strong> — the numbered list of differentiators.</p>
<p><strong>Client Logos</strong> — the trust strip near the top of the homepage. Upload an actual logo image, or leave it blank and just the client's name will show as elegant text instead.</p>
<p><strong>Nav Links</strong> — the header and footer navigation menus. Each link has a Location (header or footer), a Label, a URL, and a sort order.</p>

<h2>Media Library</h2>
<p>Every image you've ever uploaded anywhere in the admin panel lives here. Click <strong>+ Upload</strong> to add a new file, click a filename to copy its URL (handy for pasting into a field that just wants a URL), or Delete to remove it permanently — deleting here does not automatically remove it from anywhere it's already being used, so double-check nothing still references it first.</p>

<h2>Settings</h2>
<p><strong>General</strong> — agency name, tagline, phone, email, address, WhatsApp number (used for the floating WhatsApp button — enter digits only with country code, e.g. <code>91XXXXXXXXXX</code>), and the contact form's budget options (comma-separated — e.g. <code>Under ₹50k/month, ₹50k-1L/month, ₹1L+/month</code>). Phone, email, and address also appear directly on the mobile app's Contact tab.</p>
<p><strong>Appearance</strong> — background and accent color pickers. This is the one setting that changes the entire site's look <em>instantly</em>, without needing a new deployment — pick a color, hit Save settings, and refresh the live site to see it.</p>
<p><strong>Social</strong> — Instagram, LinkedIn, YouTube, Twitter/X URLs. Leave blank to hide that icon from the footer.</p>
<p><strong>SEO</strong> — the default page title/description used when a specific page doesn't set its own, plus your Google Analytics Measurement ID.</p>
<p><strong>Legal</strong> — your legal entity name, privacy contact email, and cancellation notice period. These render automatically in a small footer note at the bottom of the Privacy Policy, Terms, and Refund Policy pages — you don't need to paste them into the page content yourself.</p>

<h2>Departments &amp; Permissions (Super Admin only)</h2>
<p>Departments are how you control exactly what each editor can see and do. Go to <strong>Departments</strong> in the sidebar and create one (e.g. "Content Team", "Support"). Each department has a permission matrix: one row per resource (Leads, Blog Posts, Services, etc.), grouped by area, with four columns — <strong>Create</strong>, <strong>Read</strong>, <strong>Update</strong>, <strong>Delete</strong>. Tick exactly the cells that department should have — an editor can be given Read + Update on Blog Posts without Create or Delete, for instance. Click a column header (e.g. "Read") to toggle that permission on or off for every resource at once.</p>
<p>An editor's sidebar automatically shows only the sections their department has been granted <em>Read</em> on — no manual configuration needed beyond ticking the boxes. The same applies to buttons: an editor without "Delete" on a resource simply won't see a Delete button for it, and the server independently rejects the action even if someone tried to force it, so this is a real permission boundary, not just a hidden button.</p>
<p>Deleting a department is blocked while any admin is still assigned to it — reassign or remove those admins first.</p>

<h2>Admins (Super Admin only)</h2>
<p>Create new admin logins here, choose their role (Editor or Super Admin) and — for editors — their department, which determines their permissions. Edit an existing admin to change their name, role, department, or active status at any time. Deactivating an account doesn't delete their history — it just blocks login. You can't deactivate your own account, as a safety net against accidental lockout. Super Admins always have full access and aren't assigned to a department.</p>

<h2>Analytics</h2>
<p>A chart of leads received over the last 14 days, which services get the most interest, and which pages get the most traffic in the last 30 days. This is basic built-in analytics — for deeper insight, connect Google Analytics via the Measurement ID in Settings.</p>

<h2>Activity Log</h2>
<p>Every content change made by any admin is automatically recorded here — who did what, to which item, and when. Nothing to configure; it just works in the background.</p>

<h2>The mobile app's hidden admin section</h2>
<p>The consumer-facing mobile app has a small, unlabeled "Admin" link at the bottom of the Home tab. Tapping it opens a login screen — sign in with the same admin credentials as the web panel. Once logged in, the app asks for notification permission and registers your device: from then on, you'll get a push notification straight to your phone the moment a new lead or callback comes in, even with the app closed. Tapping the notification opens a quick-view screen with today's stats and recent leads.</p>

<h2>Troubleshooting</h2>
<ul>
<li><strong>"Invalid credentials" on login</strong> — double check you're testing against the right environment. The local development site and the live production site can have different databases with different passwords set.</li>
<li><strong>Image upload fails</strong> — if cloud storage (AWS S3) hasn't been configured yet, uploads are saved locally instead — this works fine for local testing and small deployments, but images won't survive certain types of redeploys on some hosting platforms. Ask a developer to confirm AWS S3 is configured for production.</li>
<li><strong>A page looks broken after a settings change</strong> — most content updates appear within about a minute due to caching; hard-refresh the page (Ctrl+Shift+R) if it doesn't look right immediately.</li>
</ul>
`;
