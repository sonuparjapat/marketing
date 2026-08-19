const express = require('express');
const ctrl = require('./clientLogos.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listLogos);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('client_logos.view'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('client_logos.view'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('client_logos.create'), ctrl.createLogo);
adminRouter.put('/:id', adminAuth, checkPermission('client_logos.edit'), ctrl.updateLogo);
adminRouter.delete('/:id', adminAuth, checkPermission('client_logos.delete'), ctrl.removeLogo);

module.exports = { publicRouter, adminRouter };
