const express = require('express');
const ctrl = require('./services.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listServices);
publicRouter.get('/:slug', ctrl.getService);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('services.view'), ctrl.adminList);
adminRouter.patch('/reorder', adminAuth, checkPermission('services.edit'), ctrl.reorderServices);
adminRouter.get('/:id', adminAuth, checkPermission('services.view'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('services.create'), ctrl.createService);
adminRouter.put('/:id', adminAuth, checkPermission('services.edit'), ctrl.updateService);
adminRouter.delete('/:id', adminAuth, checkPermission('services.delete'), ctrl.removeService);

module.exports = { publicRouter, adminRouter };
