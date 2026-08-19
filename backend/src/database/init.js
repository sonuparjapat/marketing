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

    await client.query(`
      CREATE TABLE IF NOT EXISTS docs (
        id           SERIAL PRIMARY KEY,
        doc_type     VARCHAR(30) UNIQUE NOT NULL,
        title        VARCHAR(200) NOT NULL,
        content      TEXT DEFAULT '',
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id           SERIAL PRIMARY KEY,
        path         VARCHAR(300) NOT NULL,
        referrer     VARCHAR(300),
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);`);

    await client.query(`ALTER TABLE admins ALTER COLUMN role SET DEFAULT 'editor';`);
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);

    await client.query('COMMIT');
    console.log('Database schema is up to date (20 tables verified/created).');
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
  await seedDefaultDocs();
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
    'hero', 'logos', 'services', 'stats', 'case_studies', 'why_us', 'testimonials', 'blog', 'cta',
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

async function seedDefaultDocs() {
  const docs = [
    { doc_type: 'user-manual', title: 'User Manual' },
    { doc_type: 'testing', title: 'Testing Guide' },
    { doc_type: 'developer', title: 'Developer Docs' },
  ];
  for (const d of docs) {
    await pool.query(
      `INSERT INTO docs (doc_type, title, content) VALUES ($1, $2, '')
       ON CONFLICT (doc_type) DO NOTHING`,
      [d.doc_type, d.title]
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
