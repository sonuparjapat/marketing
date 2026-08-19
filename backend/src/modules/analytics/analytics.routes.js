const express = require('express');
const { getAnalytics } = require('./analytics.controller');
const { adminAuth } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, getAnalytics);

module.exports = { adminRouter };
