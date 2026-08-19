const express = require('express');
const { listLogs } = require('./adminLogs.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('logs.view'), listLogs);

module.exports = { adminRouter };
