const express = require('express');
const ctrl = require('./settings.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/public', ctrl.getPublicSettings);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.listAllSettings);
adminRouter.put('/', adminAuth, ctrl.upsertSetting);
adminRouter.delete('/:key', adminAuth, ctrl.deleteSetting);

module.exports = { publicRouter, adminRouter };
