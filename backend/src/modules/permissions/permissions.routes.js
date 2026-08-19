const express = require('express');
const { listPermissions } = require('./permissions.controller');
const { adminAuth, requireSuperAdmin } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, requireSuperAdmin, listPermissions);

module.exports = { adminRouter };
