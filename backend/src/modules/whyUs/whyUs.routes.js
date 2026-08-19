const express = require('express');
const ctrl = require('./whyUs.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listWhyUs);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('why_us.view'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('why_us.view'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('why_us.create'), ctrl.createPoint);
adminRouter.put('/:id', adminAuth, checkPermission('why_us.edit'), ctrl.updatePoint);
adminRouter.delete('/:id', adminAuth, checkPermission('why_us.delete'), ctrl.removePoint);

module.exports = { publicRouter, adminRouter };
