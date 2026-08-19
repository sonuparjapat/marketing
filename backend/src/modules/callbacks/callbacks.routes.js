const express = require('express');
const { requestCallback, listCallbacks, updateCallback } = require('./callbacks.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, requestCallback);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('callbacks.view'), listCallbacks);
adminRouter.patch('/:id', adminAuth, checkPermission('callbacks.edit'), updateCallback);

module.exports = { publicRouter, adminRouter };
