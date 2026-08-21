const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { Sentry, isConfigured: sentryConfigured } = require('./config/sentry');
const { globalLimiter } = require('./middleware/rateLimiters');
const auditLog = require('./middleware/auditLog');

const leads = require('./modules/leads/leads.routes');
const callbacks = require('./modules/callbacks/callbacks.routes');
const subscribers = require('./modules/subscribers/subscribers.routes');
const posts = require('./modules/posts/posts.routes');
const blogCategories = require('./modules/blogCategories/blogCategories.routes');
const caseStudies = require('./modules/caseStudies/caseStudies.routes');
const services = require('./modules/services/services.routes');
const banners = require('./modules/banners/banners.routes');
const customers = require('./modules/customers/customers.routes');
const comments = require('./modules/comments/comments.routes');
const supportTickets = require('./modules/supportTickets/supportTickets.routes');
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
const customerAuth = require('./modules/customerAuth/customerAuth.routes');
const departments = require('./modules/departments/departments.routes');
const permissions = require('./modules/permissions/permissions.routes');
const premiumServices = require('./modules/premiumServices/premiumServices.routes');
const clients = require('./modules/clients/clients.routes');
const projects = require('./modules/projects/projects.routes');
const tasks = require('./modules/tasks/tasks.routes');
const documents = require('./modules/documents/documents.routes');
const notifications = require('./modules/notifications/notifications.routes');
const invoices = require('./modules/invoices/invoices.routes');
const appointments = require('./modules/appointments/appointments.routes');
const subscriptionPlans = require('./modules/subscriptionPlans/subscriptionPlans.routes');
const subscriptions = require('./modules/subscriptions/subscriptions.routes');
const payments = require('./modules/payments/payments.routes');
const razorpayWebhook = require('./modules/webhooks/razorpayWebhook');

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
// Mounted BEFORE express.json() — signature verification needs the exact raw bytes Razorpay
// signed; once express.json() parses the body, those original bytes are gone.
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));

// ── Public API ──────────────────────────────────────────────
app.use('/api/leads', leads.publicRouter);
app.use('/api/callbacks', callbacks.publicRouter);
app.use('/api/subscribe', subscribers.publicRouter);
app.use('/api/posts', posts.publicRouter);
app.use('/api/blog-categories', blogCategories.publicRouter);
app.use('/api/case-studies', caseStudies.publicRouter);
app.use('/api/services', services.publicRouter);
app.use('/api/banners', banners.publicRouter);
app.use('/api/comments', comments.publicRouter);
app.use('/api/support/tickets', supportTickets.customerRouter);
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
app.use('/api/auth', customerAuth.publicRouter);
app.use('/api/premium-services', premiumServices.publicRouter);
app.use('/api/subscription-plans', subscriptionPlans.publicRouter);
app.use('/api/subscriptions', subscriptions.router);

// ── Admin API ───────────────────────────────────────────────
app.use('/api/admin', auditLog);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/leads', leads.adminRouter);
app.use('/api/admin/callbacks', callbacks.adminRouter);
app.use('/api/admin/subscribers', subscribers.adminRouter);
app.use('/api/admin/posts', posts.adminRouter);
app.use('/api/admin/blog-categories', blogCategories.adminRouter);
app.use('/api/admin/case-studies', caseStudies.adminRouter);
app.use('/api/admin/services', services.adminRouter);
app.use('/api/admin/banners', banners.adminRouter);
app.use('/api/admin/customers', customers.adminRouter);
app.use('/api/admin/comments', comments.adminRouter);
app.use('/api/admin/support-tickets', supportTickets.adminRouter);
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
app.use('/api/admin/departments', departments.adminRouter);
app.use('/api/admin/permissions', permissions.adminRouter);
app.use('/api/admin/premium-services', premiumServices.adminRouter);
app.use('/api/admin/clients', clients.adminRouter);
app.use('/api/admin/projects', projects.adminRouter);
app.use('/api/admin/tasks', tasks.adminRouter);
app.use('/api/admin/documents', documents.adminRouter);
app.use('/api/admin/notifications', notifications.adminRouter);
app.use('/api/admin/invoices', invoices.adminRouter);
app.use('/api/admin/appointments', appointments.adminRouter);
app.use('/api/admin/subscription-plans', subscriptionPlans.adminRouter);
app.use('/api/admin/payments', payments.adminRouter);

app.use(notFound);
// Must be registered after every route and before the app's own error handler — it forwards
// unhandled errors to Sentry, then passes them along so errorHandler still shapes the JSON response.
if (sentryConfigured) Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

module.exports = app;
