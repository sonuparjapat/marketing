export const TESTING_HTML = `<h2>Purpose of this guide</h2>
<p>A practical checklist for verifying the site works before and after any change — whether you're testing locally, on a staging deploy, or right after pushing to production. Written so both a developer and a non-technical tester can run through it.</p>

<h2>Environments</h2>
<ul>
<li><strong>Local</strong> — backend on <code>http://localhost:5000</code>, frontend on <code>http://localhost:3000</code>, a local PostgreSQL database.</li>
<li><strong>Production</strong> — backend on Render, frontend on Vercel, database on Supabase. These are separate databases with separate admin accounts/passwords — a login that works on one will not automatically work on the other unless deliberately synced.</li>
</ul>
<p>Always confirm which environment you're testing against before reporting a bug — "it doesn't work" is often "it doesn't work in this one specific environment because an env var is missing there."</p>

<h2>Smoke test (run this first, every time)</h2>
<ol>
<li>Backend health check: <code>GET /health</code> should return <code>{"success":true}</code> within a second or two.</li>
<li>Homepage loads (<code>/</code>) with no visible layout breakage.</li>
<li>Admin login page loads (<code>/admin/login</code>) and logging in with valid credentials redirects to the dashboard.</li>
<li>Backend server logs show <code>Database schema is up to date (20 tables verified/created)</code> on boot — if the table count is ever lower than expected, a migration didn't run.</li>
</ol>

<h2>Public site test cases</h2>
<h3>Homepage</h3>
<ul>
<li>Hero video plays automatically, muted, looping</li>
<li>Every homepage section that's toggled <strong>on</strong> in Admin → Homepage → Sections actually shows; toggle one off and confirm it disappears without breaking page layout</li>
<li>"Get a Free Audit" and "View Our Work" buttons link correctly</li>
<li>Client logos render (as images where uploaded, as text where not)</li>
<li>Featured case study shows the correct badge and real numbers from its Results field</li>
</ul>
<h3>Services, Work, Blog listing pages</h3>
<ul>
<li>All published items appear; unpublished/draft items do <strong>not</strong> appear</li>
<li>Category filters (blog) and search box work and combine correctly (e.g. searching within a selected category)</li>
<li>Cover images load; items without a cover image show a clean placeholder, not a broken image icon</li>
<li>Blog pagination: with more posts than fit on one page, page 2+ shows different posts than page 1, Previous is disabled/inert on page 1, Next is disabled/inert on the last page, and combining pagination with a category/search filter shows the filtered result set's own pages (not the unfiltered full list)</li>
</ul>
<h3>Blog post detail page</h3>
<ul>
<li>Table of contents appears when the post has 2+ headings and each link scrolls to the right section</li>
<li>Reading time and view count display and the view count increments on load</li>
<li>Code blocks show syntax highlighting (colored keywords/strings), not plain monospace text</li>
<li>Share buttons (X, LinkedIn, WhatsApp, Copy link) open/behave correctly</li>
<li>Related posts (same category) appear at the bottom as image cards, excluding the current post itself</li>
<li>A post with a team-linked author shows that team member's real photo, designation, and bio in an author card below the article; a post with a "guest author" (no team member selected) shows an initial-letter avatar instead and no bio card, with no broken layout either way</li>
<li>Cover image <code>alt</code> attribute (view page source) reflects the Alt text entered in the editor, not the post title as a fallback, when Alt text was actually filled in</li>
</ul>
<h3>Service detail page</h3>
<ul>
<li>FAQ accordion shows service-specific FAQs if any exist for that service's slug, otherwise falls back to general FAQs</li>
<li>Related case studies (matching the service by tag) appear</li>
</ul>
<h3>Contact page</h3>
<ul>
<li>Service dropdown lists the live services from the database (not a hardcoded list) — adding a new service in Admin should make it appear here without a code change</li>
<li>Budget dropdown reflects whatever is set in Settings → General → budget ranges</li>
<li>Submitting with a missing name or email shows inline validation, not a silent failure</li>
<li>A successful submission shows a toast confirmation and the lead appears in Admin → Leads within seconds — watch specifically for a false error toast appearing <strong>after</strong> the success toast on a real successful submission (regression: an async form handler that reads <code>e.currentTarget</code> after an <code>await</code> will find it nulled out by React and throw, which used to overwrite a successful submission with an error state — fixed, but worth re-checking after any future edit to <code>ContactForm.tsx</code>'s submit handler)</li>
<li>Both the auto-reply email (to the submitter) and the admin alert email attempt to send — if SMTP isn't configured, check the backend logs for a "skipped email" warning rather than a hard error</li>
<li>"Or request a callback instead" opens a small modal (name, phone, preferred time) that posts to a different endpoint than the main form — submitting it should show up in Admin → Callbacks, not Admin → Leads</li>
<li>Regression: if Settings → Budget options is ever saved with a malformed value directly via the API (bypassing the admin UI's comma-separated input), the contact page must degrade to showing no budget dropdown, not throw a 500 — the page has a try/catch around parsing that setting specifically because it used to crash the whole page</li>
</ul>
<h3>Legal &amp; About pages</h3>
<ul>
<li>Content matches what's currently saved in Admin → Pages — edit one, save, refresh the public page, confirm it updated</li>
</ul>
<h3>Theme / Appearance</h3>
<ul>
<li>Change the accent or background color in Admin → Settings → Appearance, save, then reload the public site (may take up to ~60 seconds due to caching) — the whole site's color scheme should update with no code deploy</li>
</ul>

<h2>Admin panel test cases</h2>
<h3>Authentication &amp; roles</h3>
<ul>
<li>Logging in with a wrong password returns "Invalid credentials", not a server error</li>
<li>An Editor account cannot open Admin → Admins or Admin → Departments (should be hidden from their sidebar entirely, and the API should reject it with 403 if hit directly)</li>
<li>A deactivated admin cannot log in, and gets a clear "This account has been deactivated" message</li>
<li>A Super Admin cannot deactivate their own account</li>
</ul>
<h3>Departments &amp; permissions</h3>
<ul>
<li>Create a department, in the permission matrix tick only <code>Read</code> + <code>Update</code> for Blog Posts (leave Create/Delete unticked), assign an editor to it, log in as that editor: Blog appears in the sidebar, the "+ New" button and Delete links are absent, but Edit works</li>
<li>Directly calling <code>DELETE /api/admin/posts/:id</code> as that same editor (e.g. via curl/Postman with their token) returns 403 — confirms the server enforces it independently of the hidden UI, not just visually</li>
<li>A sidebar section whose resource the department has no <code>Read</code> grant for is completely absent, not just disabled</li>
<li>Clicking a column header (e.g. "Read") in the Departments permission matrix toggles that action on or off for every resource in the catalog at once</li>
<li>Deleting a department that still has admins assigned to it is rejected with a clear message, not a silent failure or a 500</li>
<li>Changing an admin's role from Editor to Super Admin (or back) via Admin → Admins correctly updates their access after their next login</li>
<li>An editor without <code>Create</code> on Media Library gets 403 on any image upload (post cover, case study cover, testimonial photo, etc.) — if a department needs to manage content with images, remember to grant Media Library Create alongside that content's own permissions</li>
<li>An editor without <code>Read</code> on Leads sees the Dashboard load fine (subscriber count, blog views, pending callbacks) but with no "Today's leads"/"Total leads" cards and no "Recent leads" table — the dashboard itself isn't blocked, only the lead-specific data within it</li>
</ul>
<h3>Content CRUD (repeat for each of: Blog, Blog Categories, Case Studies, Services, Testimonials, Team, FAQs, Client Logos, Homepage Stats, Why Us, Nav Links)</h3>
<ul>
<li>Create a new item, confirm it appears in the list immediately</li>
<li>Edit it, confirm changes save and reflect both in the admin list and on the public site</li>
<li>Delete it, confirm it disappears from both the admin list and the public site</li>
<li>Toggle any Active/Published/Featured flags and confirm the public site respects them</li>
</ul>
<h3>Blog editor specifically</h3>
<ul>
<li>Typing a title auto-fills the slug; manually editing the slug afterward stops it from auto-updating</li>
<li>Save draft keeps a post unpublished and out of the public blog list</li>
<li>The bubble menu appears only when text is selected, and disappears when selection is cleared</li>
<li>Uploading an image mid-article inserts it at the cursor position</li>
<li>SEO character counters turn red past 60 (title) / 160 (description) characters</li>
<li>Text align, text color, table insert, and YouTube embed toolbar buttons each work; inserting a table gives 3x3 cells with a header row, and columns can be dragged to resize</li>
<li>Category dropdown lists categories from Admin → Blog Categories; "Manage categories" opens that page without losing unsaved edits being a real risk — save your draft first</li>
<li>Toggling Author between "Pick from team" and "Guest author" clears/repopulates the field correctly, and publishing with each mode produces the expected author display on the public post</li>
<li>Cover image Replace swaps the image without needing to Remove first; Remove clears it back to the empty "No image" placeholder</li>
</ul>
<h3>Media Library</h3>
<ul>
<li>Uploading a file shows it in the grid immediately</li>
<li>Deleting a file removes the underlying file (local storage) or S3 object, not just the database record</li>
</ul>
<h3>Real-time notifications</h3>
<ul>
<li>With the admin dashboard open in one browser tab, submit a contact form in another tab (or via curl) — a toast notification should appear and the Inbox badge count should increment within a couple seconds, with no manual refresh</li>
<li>Visiting Admin → Leads or Admin → Callbacks clears the badge count</li>
</ul>
<h3>Dashboard</h3>
<ul>
<li>Stat cards match what you'd get by manually counting rows in Leads/Subscribers</li>
<li>Recent leads table updates live when a new lead comes in while the dashboard is open</li>
</ul>

<h2>Mobile app test cases</h2>
<ul>
<li>All 5 tabs (Home, Services, Work, Blog, Contact) load real data from the same backend as the web site</li>
<li>Tapping a service/case study/post navigates to its detail screen with a working back button</li>
<li>A post's detail screen shows its cover image, author avatar (real photo when team-linked, initial-letter circle for a guest author), and a tappable related-reading list at the bottom that navigates to another post detail screen</li>
<li>Contact form's service and budget dropdowns are populated from the live backend, matching the web site's options</li>
<li>The small "Admin" link on the Home tab opens the hidden login screen; logging in with valid admin credentials works and requests notification permission</li>
<li>After granting permission, submitting a lead from a different device/browser triggers a push notification on the phone (requires a physical device — push tokens don't work in a simulator)</li>
<li>Tapping that push notification opens the app directly to the admin quick-view screen</li>
<li>App colors match whatever is currently set in Admin → Settings → Appearance</li>
</ul>

<h2>Regression checklist before any production deploy</h2>
<ol>
<li>Run <code>npx tsc --noEmit</code> in <code>frontend/</code> and <code>mobile/</code> — must be clean</li>
<li>Run <code>npx eslint src --max-warnings=0</code> in <code>frontend/</code> — must be clean</li>
<li>Run <code>npm run build</code> in <code>frontend/</code> — must complete with no errors, and check every route listed in the output actually appears (no route silently missing)</li>
<li>Confirm the backend boots cleanly against a fresh/empty database and creates all tables (test locally against a scratch database before trusting it against production)</li>
<li>Spot-check that new/changed public pages have a correct <code>&lt;link rel="canonical"&gt;</code> pointing at their own URL (view page source) — every public route is expected to set one via <code>alternates.canonical</code></li>
<li>Re-run the smoke test above against whichever environment just changed</li>
</ol>

<h2>Known limitations to test around, not against</h2>
<p>These are intentional, not bugs — don't file them as defects:</p>
<ul>
<li>Uploads work locally without AWS credentials (saved to local disk) — this is a deliberate fallback, not broken cloud storage</li>
<li>There's no scheduled/future-dated publishing — a post is either draft or live right now</li>
<li>There's no comments system and no multi-step approval workflow</li>
<li>Department permission changes apply to an admin the next time they log in (or when the frontend silently refreshes via <code>GET /admin/me</code>) — not instantly mid-session, since permissions are embedded in the JWT rather than re-queried per request</li>
<li>Analytics is intentionally lightweight (page views + lead trends) — it is not a replacement for Google Analytics</li>
</ul>
`;
