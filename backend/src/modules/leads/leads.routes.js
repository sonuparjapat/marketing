const express = require('express');
const { createLead, listLeads, updateLead } = require('./leads.controller');
const { adminAuth } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, createLead);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, listLeads);
adminRouter.patch('/:id', adminAuth, updateLead);

module.exports = { publicRouter, adminRouter };
