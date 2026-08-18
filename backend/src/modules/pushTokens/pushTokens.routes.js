const express = require('express');
const { registerToken, unregisterToken } = require('./pushTokens.controller');
const { adminAuth } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.post('/', adminAuth, registerToken);
adminRouter.delete('/:token', adminAuth, unregisterToken);

module.exports = { adminRouter };
