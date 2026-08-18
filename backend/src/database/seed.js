require('dotenv').config();
const pool = require('../config/db');

async function seed() {
  const services = [
    ['Performance Marketing', 'performance-marketing', 'Meta & Google Ads engineered for ROAS, not vanity metrics.', 'target', 1],
    ['SEO & Content', 'seo-content', 'Organic growth systems that compound instead of expire.', 'search', 2],
    ['Brand & Creative', 'brand-creative', 'Positioning, identity and content that make people stop scrolling.', 'sparkles', 3],
    ['D2C Website & Funnels', 'website-funnels', 'Fast, conversion-first storefronts built to sell.', 'layout', 4],
    ['Marketing Automation', 'marketing-automation', 'Email, WhatsApp & CRM flows that turn buyers into repeat customers.', 'workflow', 5],
    ['Social Media Management', 'social-media-management', 'Always-on presence that builds community, not just reach.', 'users', 6],
  ];
  for (const [title, slug, short_description, icon, sort_order] of services) {
    await pool.query(
      `INSERT INTO services (title, slug, short_description, icon, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,TRUE) ON CONFLICT (slug) DO NOTHING`,
      [title, slug, short_description, icon, sort_order]
    );
  }

  const caseStudies = [
    [
      '[Your Ayurveda Brand] — Built From Zero',
      'ayurveda-brand-built-from-zero',
      '[Your Ayurveda Brand]',
      'Ayurveda & Wellness',
      'Launch a D2C Ayurvedic skincare brand from scratch — product, storefront and growth engine — with no existing audience.',
      'Built the eCommerce platform, ran performance marketing and automation ourselves, using our own capital.',
      JSON.stringify([
        { metric: 'Revenue growth', value: '+218%', label: '12 months' },
        { metric: 'Blended ROAS', value: '3.4x', label: '' },
        { metric: 'Repeat purchase rate', value: '61%', label: '' },
      ]),
      true, true,
    ],
    [
      '[D2C Fashion Brand] — Organic-Led Growth',
      'd2c-fashion-brand-organic-growth',
      '[D2C Fashion Brand]',
      'Fashion & Apparel',
      'Heavy reliance on paid ads with thinning margins and no organic funnel.',
      'Rebuilt SEO foundation and content engine alongside a leaner paid strategy.',
      JSON.stringify([
        { metric: 'Organic traffic', value: '+164%', label: '' },
        { metric: 'ROAS', value: '2.9x', label: '' },
      ]),
      false, true,
    ],
    [
      '[D2C Home & Living Brand] — Funnel Overhaul',
      'd2c-home-living-funnel-overhaul',
      '[D2C Home & Living Brand]',
      'Home & Living',
      'High traffic, low conversion — checkout drop-off above industry average.',
      'Rebuilt the funnel end-to-end and layered in automation for cart recovery.',
      JSON.stringify([
        { metric: 'Avg. order value', value: '+92%', label: '' },
        { metric: 'ROAS', value: '4.1x', label: '' },
      ]),
      false, true,
    ],
  ];
  for (const [title, slug, client_name, client_industry, challenge, solution, results_json, is_featured, is_published] of caseStudies) {
    await pool.query(
      `INSERT INTO case_studies (title, slug, client_name, client_industry, challenge, solution, results_json, is_featured, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (slug) DO NOTHING`,
      [title, slug, client_name, client_industry, challenge, solution, results_json, is_featured, is_published]
    );
  }

  const testimonials = [
    ['[Client Name]', 'Founder', '[D2C Fashion Brand]', 5, 'They understood our margins better than we did. First agency that talked P&L before pixels.', true],
    ['[Client Name]', 'CEO', '[D2C Home & Living Brand]', 5, 'Watching them run their own brand alongside ours meant zero excuses. They eat their own dog food.', true],
    ['[Client Name]', 'Co-founder', 'Sage Skin', 5, "No jargon decks. Just a weekly call where they told us what didn't work and why.", false],
  ];
  for (const [client_name, client_designation, client_company, rating, review, is_featured] of testimonials) {
    await pool.query(
      `INSERT INTO testimonials (client_name, client_designation, client_company, rating, review, is_featured, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
      [client_name, client_designation, client_company, rating, review, is_featured]
    );
  }

  const posts = [
    [
      'Performance Marketing Playbook for Indian D2C Brands',
      'performance-marketing-playbook-indian-d2c',
      'A practical breakdown of how we structure Meta & Google budgets for early-stage D2C brands in India.',
      '<p>Full article content goes here.</p>',
      'Strategy',
      JSON.stringify(['performance-marketing', 'meta-ads']),
      'Anvil Team',
    ],
    [
      "SEO Isn't Dead. It's Just Ignored.",
      'seo-isnt-dead-its-just-ignored',
      'Why most D2C brands give up on organic too early — and what compounds when you don’t.',
      '<p>Full article content goes here.</p>',
      'SEO',
      JSON.stringify(['seo']),
      'Anvil Team',
    ],
    [
      'Building a Brand vs. Running Ads: What Actually Compounds',
      'building-a-brand-vs-running-ads',
      'Ads buy attention. Brand keeps it. Notes from running both sides of that trade-off.',
      '<p>Full article content goes here.</p>',
      'Brand',
      JSON.stringify(['brand', 'strategy']),
      'Anvil Team',
    ],
  ];
  for (const [title, slug, excerpt, content, category, tags, author] of posts) {
    await pool.query(
      `INSERT INTO posts (title, slug, excerpt, content, category, tags, author, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE) ON CONFLICT (slug) DO NOTHING`,
      [title, slug, excerpt, content, category, tags, author]
    );
  }

  const stats = [
    ['50+', 'Brands scaled'],
    ['₹40Cr+', 'Ad spend managed'],
    ['6+', 'Years building & shipping'],
    ['1', 'Real D2C brand we built ourselves'],
  ];
  for (let i = 0; i < stats.length; i++) {
    const [value, label] = stats[i];
    await pool.query(
      `INSERT INTO homepage_stats (value, label, sort_order, is_active) VALUES ($1,$2,$3,TRUE)`,
      [value, label, i]
    );
  }

  const whyUs = [
    "We've shipped our own D2C brand — not just campaigns for others.",
    'Senior strategists on every account, not account managers reading a script.',
    'Transparent reporting — you see what we see, when we see it.',
    "Built for India's D2C reality — COD, regional language, festive-season spikes.",
    'No lock-in contracts. We keep clients through performance, not paperwork.',
  ];
  for (let i = 0; i < whyUs.length; i++) {
    await pool.query(
      `INSERT INTO why_us_points (point, sort_order, is_active) VALUES ($1,$2,TRUE)`,
      [whyUs[i], i]
    );
  }

  const logos = ['Lumen Home', 'North & Co', 'Sage Skin', 'Kaira', 'Orbit Foods', 'Terra'];
  for (let i = 0; i < logos.length; i++) {
    await pool.query(
      `INSERT INTO client_logos (name, sort_order, is_active) VALUES ($1,$2,TRUE)`,
      [logos[i], i]
    );
  }

  const faqs = [
    ['How quickly can we get started?', 'Most engagements kick off within a week of signing — we start with a 2-week audit sprint before any spend moves.', 'general'],
    ['Do you require long-term contracts?', "No. We work on rolling monthly retainers and keep clients through performance, not lock-in paperwork.", 'general'],
    ['What makes Anvil different from other agencies?', "We've built and run our own D2C eCommerce brand with our own money — every playbook we sell has been tested on ourselves first.", 'general'],
    ['Which industries do you work with?', 'Primarily D2C and SME brands across fashion, home & living, wellness and food — but our systems apply to any product-led business selling online in India.', 'general'],
    ['How do you report on performance?', "You get the same dashboards and numbers we look at internally, plus a weekly call — no vanity-metric decks.", 'general'],
    ["What's included in a free audit?", "A 30-minute teardown of your current funnel, ad accounts and SEO foundation, with 2-3 concrete things you could fix this week regardless of whether you hire us.", 'general'],
  ];
  for (let i = 0; i < faqs.length; i++) {
    const [question, answer, category] = faqs[i];
    await pool.query(
      `INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES ($1,$2,$3,$4,TRUE)`,
      [question, answer, category, i]
    );
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
