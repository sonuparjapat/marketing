const express = require('express');
const { createLead, listLeads, updateLead } = require('./leads.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, createLead);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('leads.view'), listLeads);
adminRouter.patch('/:id', adminAuth, checkPermission('leads.edit'), updateLead);

module.exports = { publicRouter, adminRouter };
