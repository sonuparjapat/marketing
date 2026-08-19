const express = require('express');
const { getAnalytics } = require('./analytics.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('analytics.view'), getAnalytics);

module.exports = { adminRouter };
