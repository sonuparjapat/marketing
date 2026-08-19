const express = require('express');
const ctrl = require('./banners.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listBanners);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('banners.read'), ctrl.adminList);
adminRouter.patch('/reorder', adminAuth, checkPermission('banners.update'), ctrl.reorderBanners);
adminRouter.get('/:id', adminAuth, checkPermission('banners.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('banners.create'), ctrl.createBanner);
adminRouter.put('/:id', adminAuth, checkPermission('banners.update'), ctrl.updateBanner);
adminRouter.delete('/:id', adminAuth, checkPermission('banners.delete'), ctrl.removeBanner);

module.exports = { publicRouter, adminRouter };
