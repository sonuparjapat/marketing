const express = require('express');
const ctrl = require('./settings.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/public', ctrl.getPublicSettings);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('settings.view'), ctrl.listAllSettings);
adminRouter.put('/', adminAuth, checkPermission('settings.edit'), ctrl.upsertSetting);
adminRouter.delete('/:key', adminAuth, checkPermission('settings.edit'), ctrl.deleteSetting);

module.exports = { publicRouter, adminRouter };
