const express = require('express');
const ctrl = require('./services.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listServices);
publicRouter.get('/:slug', ctrl.getService);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.patch('/reorder', adminAuth, ctrl.reorderServices);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createService);
adminRouter.put('/:id', adminAuth, ctrl.updateService);
adminRouter.delete('/:id', adminAuth, ctrl.removeService);

module.exports = { publicRouter, adminRouter };
