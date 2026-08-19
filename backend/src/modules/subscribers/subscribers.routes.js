const express = require('express');
const { subscribe, listSubscribers, exportSubscribersCsv } = require('./subscribers.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, subscribe);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('subscribers.view'), listSubscribers);
adminRouter.get('/export', adminAuth, checkPermission('subscribers.export'), exportSubscribersCsv);

module.exports = { publicRouter, adminRouter };
