const express = require('express');
const ctrl = require('./premiumServices.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listActive);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('premium_services.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('premium_services.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('premium_services.create'), ctrl.createService);
adminRouter.put('/:id', adminAuth, checkPermission('premium_services.update'), ctrl.updateService);

module.exports = { publicRouter, adminRouter };
