const express = require('express');
const { subscribe, listSubscribers, exportSubscribersCsv } = require('./subscribers.controller');
const { adminAuth } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, subscribe);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, listSubscribers);
adminRouter.get('/export', adminAuth, exportSubscribersCsv);

module.exports = { publicRouter, adminRouter };
