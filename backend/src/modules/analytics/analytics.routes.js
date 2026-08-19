const express = require('express');
const { getAnalytics } = require('./analytics.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('analytics.read'), getAnalytics);

module.exports = { adminRouter };
