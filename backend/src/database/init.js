const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(120) NOT NULL,
        email          VARCHAR(200) UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        role           VARCHAR(30) DEFAULT 'admin',
        last_login     TIMESTAMP,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id                  SERIAL PRIMARY KEY,
        name                VARCHAR(120) NOT NULL,
        email               VARCHAR(200) NOT NULL,
        phone               VARCHAR(20),
        company             VARCHAR(150),
        service_interested  VARCHAR(100),
        budget_range        VARCHAR(50),
        message             TEXT,
        source              VARCHAR(80),
        status              VARCHAR(30) DEFAULT 'new',
        notes               TEXT,
        created_at          TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id                SERIAL PRIMARY KEY,
        title             VARCHAR(300) NOT NULL,
        slug              VARCHAR(300) UNIQUE NOT NULL,
        excerpt           TEXT,
        content           TEXT,
        cover_image       TEXT,
        category          VARCHAR(100),
        tags              JSONB DEFAULT '[]',
        author            VARCHAR(120),
        meta_title        VARCHAR(200),
        meta_description  VARCHAR(320),
        is_published      BOOLEAN DEFAULT FALSE,
        views             INT DEFAULT 0,
        created_at        TIMESTAMP DEFAULT NOW(),
        updated_at        TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS case_studies (
        id                SERIAL PRIMARY KEY,
        title             VARCHAR(300) NOT NULL,
        slug              VARCHAR(300) UNIQUE NOT NULL,
        client_name       VARCHAR(150),
        client_industry   VARCHAR(100),
        challenge         TEXT,
        solution          TEXT,
        results_json      JSONB DEFAULT '[]',
        cover_image       TEXT,
        tags              JSONB DEFAULT '[]',
        is_featured       BOOLEAN DEFAULT FALSE,
        is_published      BOOLEAN DEFAULT FALSE,
        created_at        TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(is_published, created_at DESC);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id                  SERIAL PRIMARY KEY,
        title               VARCHAR(200) NOT NULL,
        slug                VARCHAR(200) UNIQUE NOT NULL,
        short_description   TEXT,
        full_description    TEXT,
        icon                VARCHAR(100),
        features_json       JSONB DEFAULT '[]',
        is_active           BOOLEAN DEFAULT TRUE,
        sort_order          INT DEFAULT 0
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, sort_order);`);

    // Admin-managed hero banners/carousel — image + copy + CTA an admin fully controls, no deploy needed.
    // "placement" separates the homepage hero rotation from a smaller secondary promo strip.
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id            SERIAL PRIMARY KEY,
        tag_label     VARCHAR(120),
        title         VARCHAR(300) NOT NULL,
        subtitle      TEXT,
        image_url     TEXT NOT NULL,
        button_label  VARCHAR(80),
        button_link   VARCHAR(300),
        placement     VARCHAR(20) DEFAULT 'hero',
        is_active     BOOLEAN DEFAULT TRUE,
        sort_order    INT DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, placement, sort_order);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id                   SERIAL PRIMARY KEY,
        client_name          VARCHAR(120) NOT NULL,
        client_designation   VARCHAR(150),
        client_company       VARCHAR(150),
        client_photo         TEXT,
        rating               INT DEFAULT 5,
        review               TEXT NOT NULL,
        is_featured          BOOLEAN DEFAULT FALSE,
        is_active            BOOLEAN DEFAULT TRUE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS team (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(120) NOT NULL,
        designation    VARCHAR(150),
        bio            TEXT,
        photo          TEXT,
        linkedin_url   VARCHAR(300),
        sort_order     INT DEFAULT 0,
        is_active      BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id          SERIAL PRIMARY KEY,
        email       VARCHAR(200) UNIQUE NOT NULL,
        name        VARCHAR(120),
        is_active   BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS callbacks (
        id               SERIAL PRIMARY KEY,
        name             VARCHAR(120) NOT NULL,
        phone            VARCHAR(20) NOT NULL,
        preferred_time   VARCHAR(80),
        status           VARCHAR(30) DEFAULT 'pending',
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id           SERIAL PRIMARY KEY,
        key          VARCHAR(100) UNIQUE NOT NULL,
        value        TEXT,
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id            SERIAL PRIMARY KEY,
        url           TEXT NOT NULL,
        filename      VARCHAR(300),
        mime_type     VARCHAR(100),
        size_bytes    INT,
        uploaded_by   INT REFERENCES admins(id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS nav_links (
        id           SERIAL PRIMARY KEY,
        label        VARCHAR(100) NOT NULL,
        href         VARCHAR(300) NOT NULL,
        location     VARCHAR(20) NOT NULL DEFAULT 'header',
        sort_order   INT DEFAULT 0,
        is_active    BOOLEAN DEFAULT TRUE,
        UNIQUE (label, location)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nav_links_location ON nav_links(location, sort_order);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS homepage_stats (
        id           SERIAL PRIMARY KEY,
        value        VARCHAR(50) NOT NULL,
        label        VARCHAR(150) NOT NULL,
        sort_order   INT DEFAULT 0,
        is_active    BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS why_us_points (
        id           SERIAL PRIMARY KEY,
        point        TEXT NOT NULL,
        sort_order   INT DEFAULT 0,
        is_active    BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_logos (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(150) NOT NULL,
        logo_url     TEXT,
        sort_order   INT DEFAULT 0,
        is_active    BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id           SERIAL PRIMARY KEY,
        question     TEXT NOT NULL,
        answer       TEXT NOT NULL,
        category     VARCHAR(100) DEFAULT 'general',
        sort_order   INT DEFAULT 0,
        is_active    BOOLEAN DEFAULT TRUE
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, sort_order);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id                 SERIAL PRIMARY KEY,
        slug               VARCHAR(100) UNIQUE NOT NULL,
        title              VARCHAR(200) NOT NULL,
        content            TEXT,
        meta_title         VARCHAR(200),
        meta_description   VARCHAR(320),
        updated_at         TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS homepage_sections (
        id            SERIAL PRIMARY KEY,
        section_key   VARCHAR(50) UNIQUE NOT NULL,
        is_enabled    BOOLEAN DEFAULT TRUE,
        sort_order    INT DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id           SERIAL PRIMARY KEY,
        admin_id     INT REFERENCES admins(id) ON DELETE CASCADE,
        token        VARCHAR(300) UNIQUE NOT NULL,
        platform     VARCHAR(20),
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id           SERIAL PRIMARY KEY,
        admin_id     INT REFERENCES admins(id) ON DELETE SET NULL,
        action       VARCHAR(20) NOT NULL,
        module       VARCHAR(60) NOT NULL,
        record_id    VARCHAR(50),
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);`);

    // Admin docs (User Manual / Testing / Developer) moved from a DB-backed CMS to static,
    // code-defined React pages — see frontend/src/content/adminDocs/. Drop the now-unused table.
    await client.query(`DROP TABLE IF EXISTS docs;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id           SERIAL PRIMARY KEY,
        path         VARCHAR(300) NOT NULL,
        referrer     VARCHAR(300),
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);`);

    // Public-site customer accounts — a separate identity space from admins (see customerAuth
    // middleware). is_premium is a placeholder flag for future gated content/services; nothing
    // reads it yet.
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id             SERIAL PRIMARY KEY,
        name           VARCHAR(150) NOT NULL,
        email          VARCHAR(200) UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        is_premium     BOOLEAN DEFAULT FALSE,
        is_active      BOOLEAN DEFAULT TRUE,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;`);
    // token_version powers real session revocation — bumping it instantly invalidates every
    // already-issued JWT for that account (password change, account deletion) without needing a
    // token blacklist/Redis; auth middleware checks it against the DB on every request.
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1;`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`);
    // is_verified defaults TRUE so every account that existed before email verification shipped
    // stays able to log in — register() is the only insert path and explicitly passes false for
    // new signups, so verification only applies going forward.
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;`);

    // Customer-submitted reviews reuse the testimonials table rather than a parallel one —
    // customer_id NULL means admin-authored (auto-approved, unchanged prior behavior); a customer
    // submission sets customer_id and starts unapproved until admin flips is_approved.
    await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS customer_id INT REFERENCES customers(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;`);
    // home_sort_order is NULL for "not shown on the homepage" and 1..5 for "shown, in this
    // position" — replaces the old plain is_featured boolean as the homepage curation mechanism,
    // since a boolean can't express "which 5, in what order" or enforce a cap. Set exclusively via
    // PUT /admin/testimonials/homepage-selection (backend/src/modules/testimonials), never the
    // generic admin CRUD, so the 5-max/ordering invariant only has one place it can be violated.
    await client.query(`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS home_sort_order INT;`);

    // Blog comments — auto-published (no moderation queue), with an admin delete-after-the-fact
    // affordance instead. Deleting the post or the commenting customer cascades the comment away.
    // parent_id makes a comment a reply — NULL means a top-level comment.
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id             SERIAL PRIMARY KEY,
        post_id        INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        parent_id      INT REFERENCES comments(id) ON DELETE CASCADE,
        content        TEXT NOT NULL,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES comments(id) ON DELETE CASCADE;`);
    // reply_to_id is the SPECIFIC comment a reply was aimed at, which may itself be a reply —
    // parent_id always collapses to the top-level thread root (YouTube's actual model: replies
    // are a flat list under the top comment, never nested more than one level deep, which is what
    // keeps threads readable). reply_to_id is only used to render the "@Name" mention when a reply
    // was aimed at another reply rather than the top-level comment itself.
    await client.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to_id INT REFERENCES comments(id) ON DELETE SET NULL;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);`);

    // Likes/dislikes on posts and comments — one vote per customer per target, switching between
    // like/dislike updates the row (UNIQUE constraint + ON CONFLICT upsert in the controller)
    // rather than allowing duplicates.
    await client.query(`
      CREATE TABLE IF NOT EXISTS post_votes (
        id             SERIAL PRIMARY KEY,
        post_id        INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vote_type      VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
        created_at     TIMESTAMP DEFAULT NOW(),
        UNIQUE (post_id, customer_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_post_votes_post ON post_votes(post_id, vote_type);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comment_votes (
        id             SERIAL PRIMARY KEY,
        comment_id     INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vote_type      VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
        created_at     TIMESTAMP DEFAULT NOW(),
        UNIQUE (comment_id, customer_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id, vote_type);`);

    // Support tickets — a customer opens one (with its first message), admin replies land as more
    // rows in ticket_messages. Real-time is admin-side only (existing Socket.IO room); the customer
    // finds out about a reply by email, not a live connection.
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id             SERIAL PRIMARY KEY,
        customer_id    INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        subject        VARCHAR(200) NOT NULL,
        status         VARCHAR(20) DEFAULT 'open',
        created_at     TIMESTAMP DEFAULT NOW(),
        updated_at     TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id, created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id             SERIAL PRIMARY KEY,
        ticket_id      INT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_type    VARCHAR(10) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
        sender_id      INT NOT NULL,
        message        TEXT NOT NULL,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);`);

    await client.query(`ALTER TABLE admins ALTER COLUMN role SET DEFAULT 'editor';`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1;`);
    // TOTP two-factor auth — secret is only set once the admin completes setup by verifying a
    // code; totp_enabled gates whether login requires the second step.
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) UNIQUE NOT NULL,
        description   TEXT,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // RBAC, resource-level: one permission row per manageable resource (not per action).
    // Grants live on department_permissions as four explicit CRUD flags per (department, resource)
    // pair, rather than as separate permission rows per action — mirrors how permission systems
    // are modeled in most production admin panels (a resource entity + a CRUD capability set),
    // rather than treating each action as its own atomic permission record.
    //
    // One-time migration: the previous schema had `permissions.module`/`.action`/`.key` (one row
    // per resource+action) and a plain department_permissions join table with no CRUD columns.
    // Detect that old shape and drop it before recreating — safe because this RBAC feature is new
    // enough that no production department/permission data depends on the old rows surviving.
    const permsShape = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'resource_key'`
    );
    if (permsShape.rows.length === 0) {
      await client.query(`DROP TABLE IF EXISTS department_permissions;`);
      await client.query(`DROP TABLE IF EXISTS permissions;`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id            SERIAL PRIMARY KEY,
        resource_key  VARCHAR(80) UNIQUE NOT NULL,
        label         VARCHAR(150) NOT NULL,
        module_group  VARCHAR(60) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS department_permissions (
        department_id   INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        permission_id    INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        can_create       BOOLEAN NOT NULL DEFAULT FALSE,
        can_read         BOOLEAN NOT NULL DEFAULT FALSE,
        can_update       BOOLEAN NOT NULL DEFAULT FALSE,
        can_delete       BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (department_id, permission_id)
      );
    `);

    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) UNIQUE NOT NULL,
        slug          VARCHAR(100) UNIQUE NOT NULL,
        sort_order    INT DEFAULT 0
      );
    `);

    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id INT REFERENCES team(id) ON DELETE SET NULL;`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_alt VARCHAR(300);`);

    // --- Premium subscriptions (Razorpay) -----------------------------------------------------
    // premium_services is the admin-managed catalog of gate-able features/content (e.g. a service
    // key a blog post can require). subscription_plans are the purchasable "cards" (1-month/3-month/
    // 1-year style); plan_services is which services each plan bundles. Both catalogs are soft-delete
    // only (is_active) — see the plan doc: a hard DELETE would either cascade away subscriber history
    // or be blocked by the FKs from customer_subscriptions/posts, so deactivation is the only path
    // exposed in the admin UI.
    await client.query(`
      CREATE TABLE IF NOT EXISTS premium_services (
        id            SERIAL PRIMARY KEY,
        key           VARCHAR(80) UNIQUE NOT NULL,
        label         VARCHAR(150) NOT NULL,
        description   TEXT,
        is_active     BOOLEAN DEFAULT TRUE,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(150) NOT NULL,
        description     TEXT,
        duration_days   INT NOT NULL,
        price_paise     INT NOT NULL,
        is_active       BOOLEAN DEFAULT TRUE,
        sort_order      INT DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_services (
        id            SERIAL PRIMARY KEY,
        plan_id       INT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        service_id    INT NOT NULL REFERENCES premium_services(id),
        UNIQUE (plan_id, service_id)
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_plan_services_plan ON plan_services(plan_id);`);

    // status only ever records an explicit terminal state (cancelled/refunded) written by an
    // admin action — whether a subscription currently grants access is always DERIVED at query
    // time (status = 'active' AND expires_at > NOW()), never eagerly flipped by a cron. Buying
    // again before expiry is allowed and simply adds another row; entitlement is the union of
    // every currently-unexpired row for that customer, so an early renewal never loses access.
    // customer_id deliberately has NO ON DELETE CASCADE (unlike comments/tickets above) — this is
    // a financial/billing record, not user-generated content, and deleteAccount() explicitly
    // blocks self-deletion while payment history exists rather than silently destroying it.
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_subscriptions (
        id            SERIAL PRIMARY KEY,
        customer_id   INT NOT NULL REFERENCES customers(id),
        plan_id       INT NOT NULL REFERENCES subscription_plans(id),
        started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at    TIMESTAMP NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'refunded')),
        payment_id    INT,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customer_subs_customer ON customer_subscriptions(customer_id, status, expires_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customer_subs_plan ON customer_subscriptions(plan_id, status, expires_at);`);

    // One payments row per checkout attempt (status starts 'created', becomes 'paid'/'failed').
    // razorpay_order_id is unique — a customer retrying a failed checkout for the same plan starts
    // a fresh row/fresh Razorpay order rather than reusing one, so there's never ambiguity about
    // which attempt a given payment_id belongs to.
    // Same reasoning as customer_subscriptions above — no cascade on a financial record.
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id                    SERIAL PRIMARY KEY,
        customer_id           INT NOT NULL REFERENCES customers(id),
        plan_id               INT NOT NULL REFERENCES subscription_plans(id),
        razorpay_order_id     VARCHAR(100) UNIQUE NOT NULL,
        razorpay_payment_id   VARCHAR(100),
        razorpay_signature    TEXT,
        amount_paise          INT NOT NULL,
        status                VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
        created_at            TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id, created_at DESC);`);

    // Full admin-visible audit trail of every payment-related event (order created, verified,
    // webhook received, refunded) — separate from `payments` (current state) so the history is
    // append-only and never overwritten.
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id                    SERIAL PRIMARY KEY,
        event_type            VARCHAR(40) NOT NULL,
        razorpay_order_id     VARCHAR(100),
        razorpay_payment_id   VARCHAR(100),
        customer_id           INT REFERENCES customers(id) ON DELETE SET NULL,
        metadata              JSONB DEFAULT '{}',
        created_at            TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_logs_order ON payment_logs(razorpay_order_id);`);

    // Premium blog gating — a post can require one specific service; posts.controller.js withholds
    // `content` (but not title/excerpt) from anyone lacking an active subscription that includes it.
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;`);
    await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS required_service_id INT REFERENCES premium_services(id) ON DELETE SET NULL;`);

    await client.query('COMMIT');
    console.log('Database schema is up to date.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await seedAdmin();
  await seedDefaultSettings();
  await seedDefaultPages();
  await seedDefaultHomepageSections();
  await seedDefaultNavLinks();
  await seedPermissions();
}

// The permission catalog — every module a department can be granted access to,
// and the actions available within it. Deliberately excludes "admins" and
// "departments" themselves: managing admin accounts and permissions stays
// Super Admin-only regardless of department, so there's no scenario where a
// department could grant itself more access.
// One row per manageable resource. `label` is the human-readable resource name; department grants
// against it are the four can_create/can_read/can_update/can_delete flags on department_permissions
// (see the schema above), not separate permission rows per action. `group` is purely a UI grouping
// hint for the Departments permission matrix, matching AdminShell's sidebar groupings.
const PERMISSION_MODULES = [
  { key: 'leads', label: 'Leads', group: 'Inbox' },
  { key: 'callbacks', label: 'Callbacks', group: 'Inbox' },
  { key: 'subscribers', label: 'Subscribers', group: 'Inbox' },
  { key: 'customers', label: 'Customers', group: 'Inbox' },
  { key: 'support_tickets', label: 'Support Tickets', group: 'Inbox' },
  { key: 'posts', label: 'Blog Posts', group: 'Content' },
  { key: 'blog_categories', label: 'Blog Categories', group: 'Content' },
  { key: 'case_studies', label: 'Case Studies', group: 'Content' },
  { key: 'services', label: 'Services', group: 'Content' },
  { key: 'testimonials', label: 'Testimonials', group: 'Content' },
  { key: 'comments', label: 'Comments', group: 'Content' },
  { key: 'team', label: 'Team', group: 'Content' },
  { key: 'faqs', label: 'FAQs', group: 'Content' },
  { key: 'pages', label: 'Pages', group: 'Content' },
  { key: 'nav_links', label: 'Nav Links', group: 'Homepage' },
  { key: 'homepage_stats', label: 'Homepage Stats', group: 'Homepage' },
  { key: 'why_us', label: 'Why Us', group: 'Homepage' },
  { key: 'client_logos', label: 'Client Logos', group: 'Homepage' },
  { key: 'homepage_sections', label: 'Homepage Sections', group: 'Homepage' },
  { key: 'banners', label: 'Banners', group: 'Homepage' },
  { key: 'premium_services', label: 'Premium Services', group: 'Subscriptions' },
  { key: 'subscription_plans', label: 'Subscription Plans', group: 'Subscriptions' },
  { key: 'payments', label: 'Payments', group: 'Subscriptions' },
  { key: 'media', label: 'Media Library', group: 'System' },
  { key: 'settings', label: 'Settings', group: 'System' },
  { key: 'analytics', label: 'Analytics', group: 'Insights' },
  { key: 'logs', label: 'Activity Log', group: 'Insights' },
];

async function seedPermissions() {
  for (const { key, label, group } of PERMISSION_MODULES) {
    await pool.query(
      `INSERT INTO permissions (resource_key, label, module_group) VALUES ($1, $2, $3)
       ON CONFLICT (resource_key) DO NOTHING`,
      [key, label, group]
    );
  }
}

async function seedAdmin() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admins');
  if (rows[0].count > 0) return;

  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('No admins exist yet, and SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are not set — skipping seed.');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
    [name, email, hash, 'super_admin']
  );
  console.log(`Seeded first admin account: ${email}`);
}

async function seedDefaultSettings() {
  const defaults = {
    agency_name: 'Anvil Digital',
    tagline: "We don't just market brands. We've built one.",
    phone: '+91 98XXX XXXXX',
    email: 'hello@anvil.agency',
    whatsapp_number: '91XXXXXXXXXX',
    address: '',
    instagram_url: '',
    linkedin_url: '',
    youtube_url: '',
    twitter_url: '',
    default_meta_title: "Anvil Digital — We don't just market brands. We've built one.",
    default_meta_description:
      'Anvil is a performance marketing agency for D2C & SME brands in India, built by people who have shipped their own eCommerce brand.',
    ga_measurement_id: '',
    agency_legal_name: 'Anvil Digital',
    privacy_contact_email: 'hello@anvil.agency',
    notice_period: '30 days',
    budget_ranges: JSON.stringify(['Under ₹50k/month', '₹50k–₹1.5L/month', '₹1.5L–₹5L/month', '₹5L+/month']),
    primary_color: '#14171f',
    accent_color: '#d4af6a',
  };

  for (const [key, value] of Object.entries(defaults)) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }
}

async function seedDefaultPages() {
  const pages = [
    {
      slug: 'about',
      title: 'About',
      content: `<p>We got tired of agencies that had never run their own P&amp;L.</p>
<p>Most agencies sell strategy they've never had to live with. We built a real D2C eCommerce brand from zero — product, storefront, ads, retention — with our own money on the line. That experience is the reason our advice sounds less like a deck and more like something a founder would say.</p>
<p>Today we run that same playbook for D2C and SME brands across India: performance marketing, SEO, brand, and the automation that turns one-time buyers into repeat customers.</p>`,
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: `<p>Last updated: [DATE]</p>
<h2>Information we collect</h2>
<p>When you submit a contact form, request a callback, or subscribe to our newsletter, we collect the information you provide — name, email, phone number, company and any message content. We also collect standard analytics data (pages visited, device type, approximate location) via Google Analytics.</p>
<h2>How we use it</h2>
<p>We use this information to respond to your enquiry, provide the services you request, send occasional newsletter emails you've opted into, and improve our website. We do not sell your personal information to third parties.</p>
<h2>Data retention & your rights</h2>
<p>We retain lead and enquiry data for as long as reasonably necessary for business purposes. You can request access to, correction of, or deletion of your data at any time by emailing [PRIVACY_CONTACT_EMAIL].</p>
<h2>Cookies</h2>
<p>We use cookies and similar technologies for analytics and to remember basic preferences. You can disable cookies in your browser settings at any time.</p>
<h2>Contact</h2>
<p>Questions about this policy can be sent to [PRIVACY_CONTACT_EMAIL].</p>`,
    },
    {
      slug: 'terms',
      title: 'Terms of Service',
      content: `<p>Last updated: [DATE]</p>
<h2>Use of this website</h2>
<p>This website is provided for informational purposes to help you evaluate and engage our marketing services. By using it you agree not to misuse the site, attempt to access it via unauthorized means, or copy its content without permission.</p>
<h2>Services</h2>
<p>Any services described on this website are subject to a separate signed agreement or statement of work between [AGENCY_LEGAL_NAME] and the client, which governs scope, deliverables, timelines and fees.</p>
<h2>Intellectual property</h2>
<p>All content on this site — copy, design, case study data and branding — is the property of [AGENCY_LEGAL_NAME] unless otherwise credited.</p>
<h2>Limitation of liability</h2>
<p>We make reasonable efforts to keep this website accurate and available, but we do not guarantee uninterrupted access and are not liable for any loss arising from its use.</p>
<h2>Contact</h2>
<p>Questions about these terms can be sent to [CONTACT_EMAIL].</p>`,
    },
    {
      slug: 'refund-policy',
      title: 'Refund Policy',
      content: `<p>Last updated: [DATE]</p>
<h2>Retainers & project fees</h2>
<p>Marketing retainers are billed in advance for each period of service. Because strategy, planning and campaign setup work begins immediately, fees already earned for work delivered in the current period are non-refundable.</p>
<h2>Ad spend</h2>
<p>Amounts passed through directly to advertising platforms (Meta, Google, etc.) are governed by those platforms' own billing and refund policies, not by [AGENCY_LEGAL_NAME].</p>
<h2>Cancellations</h2>
<p>Either party may cancel an ongoing engagement with [NOTICE_PERIOD] written notice, as set out in the signed statement of work. Any unused, pre-paid balance for periods not yet started will be refunded.</p>
<h2>Contact</h2>
<p>For refund requests, email [CONTACT_EMAIL] with your invoice details.</p>`,
    },
  ];

  for (const p of pages) {
    await pool.query(
      `INSERT INTO pages (slug, title, content) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.title, p.content]
    );
  }
}

async function seedDefaultHomepageSections() {
  const sections = [
    'hero', 'banners', 'logos', 'services', 'process', 'stats', 'case_studies', 'why_us', 'testimonials', 'blog', 'cta',
  ];
  for (let i = 0; i < sections.length; i++) {
    await pool.query(
      `INSERT INTO homepage_sections (section_key, is_enabled, sort_order) VALUES ($1, TRUE, $2)
       ON CONFLICT (section_key) DO NOTHING`,
      [sections[i], i]
    );
  }
}

async function seedDefaultNavLinks() {
  const header = ['Services', 'Work', 'About', 'Blog', 'Contact'];
  const footerCompany = ['About', 'Our Work', 'Blog', 'Contact'];

  for (let i = 0; i < header.length; i++) {
    const label = header[i];
    const href = `/${label === 'About' ? 'about' : label.toLowerCase()}`;
    await pool.query(
      `INSERT INTO nav_links (label, href, location, sort_order, is_active)
       VALUES ($1, $2, 'header', $3, TRUE)
       ON CONFLICT (label, location) DO NOTHING`,
      [label, href, i]
    );
  }

  for (let i = 0; i < footerCompany.length; i++) {
    const label = footerCompany[i];
    const href = label === 'About' ? '/about' : label === 'Our Work' ? '/work' : `/${label.toLowerCase()}`;
    await pool.query(
      `INSERT INTO nav_links (label, href, location, sort_order, is_active)
       VALUES ($1, $2, 'footer', $3, TRUE)
       ON CONFLICT (label, location) DO NOTHING`,
      [label, href, i]
    );
  }
}

module.exports = initDB;

if (require.main === module) {
  require('dotenv').config();
  initDB()
    .then(() => {
      console.log('DB init complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('DB init failed:', err);
      process.exit(1);
    });
}
