const express = require('express');
const ctrl = require('./pages.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/:slug', ctrl.getPage);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('pages.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('pages.read'), ctrl.adminGetOne);
adminRouter.put('/:id', adminAuth, checkPermission('pages.update'), ctrl.updatePage);

module.exports = { publicRouter, adminRouter };
