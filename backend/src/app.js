const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiters');
const auditLog = require('./middleware/auditLog');

const leads = require('./modules/leads/leads.routes');
const callbacks = require('./modules/callbacks/callbacks.routes');
const subscribers = require('./modules/subscribers/subscribers.routes');
const posts = require('./modules/posts/posts.routes');
const caseStudies = require('./modules/caseStudies/caseStudies.routes');
const services = require('./modules/services/services.routes');
const testimonials = require('./modules/testimonials/testimonials.routes');
const team = require('./modules/team/team.routes');
const settings = require('./modules/settings/settings.routes');
const adminAuthRoutes = require('./modules/admin/admin.routes');
const media = require('./modules/media/media.routes');
const navLinks = require('./modules/navLinks/navLinks.routes');
const homepageStats = require('./modules/homepageStats/homepageStats.routes');
const whyUs = require('./modules/whyUs/whyUs.routes');
const clientLogos = require('./modules/clientLogos/clientLogos.routes');
const faqs = require('./modules/faqs/faqs.routes');
const pages = require('./modules/pages/pages.routes');
const homepageSections = require('./modules/homepageSections/homepageSections.routes');
const pushTokens = require('./modules/pushTokens/pushTokens.routes');
const admins = require('./modules/admins/admins.routes');
const adminLogs = require('./modules/adminLogs/adminLogs.routes');
const analytics = require('./modules/analytics/analytics.routes');
const tracking = require('./modules/tracking/tracking.routes');
const docs = require('./modules/docs/docs.routes');
const departments = require('./modules/departments/departments.routes');
const permissions = require('./modules/permissions/permissions.routes');

const app = express();

app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.set('trust proxy', 1);
app.use(globalLimiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { skip: (req) => req.path === '/health' }));

const allowedOrigins = [process.env.FRONTEND_URL, /^http:\/\/localhost:\d+$/, /^exp:\/\//];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

// ── Public API ──────────────────────────────────────────────
app.use('/api/leads', leads.publicRouter);
app.use('/api/callbacks', callbacks.publicRouter);
app.use('/api/subscribe', subscribers.publicRouter);
app.use('/api/posts', posts.publicRouter);
app.use('/api/case-studies', caseStudies.publicRouter);
app.use('/api/services', services.publicRouter);
app.use('/api/testimonials', testimonials.publicRouter);
app.use('/api/team', team.publicRouter);
app.use('/api/settings', settings.publicRouter);
app.use('/api/nav-links', navLinks.publicRouter);
app.use('/api/homepage-stats', homepageStats.publicRouter);
app.use('/api/why-us', whyUs.publicRouter);
app.use('/api/client-logos', clientLogos.publicRouter);
app.use('/api/faqs', faqs.publicRouter);
app.use('/api/pages', pages.publicRouter);
app.use('/api/homepage-sections', homepageSections.publicRouter);
app.use('/api/track', tracking.publicRouter);
app.use('/api/docs', docs.publicRouter);

// ── Admin API ───────────────────────────────────────────────
app.use('/api/admin', auditLog);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/leads', leads.adminRouter);
app.use('/api/admin/callbacks', callbacks.adminRouter);
app.use('/api/admin/subscribers', subscribers.adminRouter);
app.use('/api/admin/posts', posts.adminRouter);
app.use('/api/admin/case-studies', caseStudies.adminRouter);
app.use('/api/admin/services', services.adminRouter);
app.use('/api/admin/testimonials', testimonials.adminRouter);
app.use('/api/admin/team', team.adminRouter);
app.use('/api/admin/settings', settings.adminRouter);
app.use('/api/admin/media', media.adminRouter);
app.use('/api/admin/nav-links', navLinks.adminRouter);
app.use('/api/admin/homepage-stats', homepageStats.adminRouter);
app.use('/api/admin/why-us', whyUs.adminRouter);
app.use('/api/admin/client-logos', clientLogos.adminRouter);
app.use('/api/admin/faqs', faqs.adminRouter);
app.use('/api/admin/pages', pages.adminRouter);
app.use('/api/admin/homepage-sections', homepageSections.adminRouter);
app.use('/api/admin/push-tokens', pushTokens.adminRouter);
app.use('/api/admin/admins', admins.adminRouter);
app.use('/api/admin/logs', adminLogs.adminRouter);
app.use('/api/admin/analytics', analytics.adminRouter);
app.use('/api/admin/docs', docs.adminRouter);
app.use('/api/admin/departments', departments.adminRouter);
app.use('/api/admin/permissions', permissions.adminRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
