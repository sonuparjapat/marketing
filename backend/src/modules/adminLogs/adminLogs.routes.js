const express = require('express');
const { listLogs } = require('./adminLogs.controller');
const { adminAuth } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, listLogs);

module.exports = { adminRouter };
