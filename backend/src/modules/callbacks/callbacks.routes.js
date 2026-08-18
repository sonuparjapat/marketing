const express = require('express');
const { requestCallback, listCallbacks, updateCallback } = require('./callbacks.controller');
const { adminAuth } = require('../../middleware/auth');
const { publicFormLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/', publicFormLimiter, requestCallback);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, listCallbacks);
adminRouter.patch('/:id', adminAuth, updateCallback);

module.exports = { publicRouter, adminRouter };
