const express = require('express');
const ctrl = require('./homepageStats.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listStats);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('homepage_stats.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('homepage_stats.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('homepage_stats.create'), ctrl.createStat);
adminRouter.put('/:id', adminAuth, checkPermission('homepage_stats.update'), ctrl.updateStat);
adminRouter.delete('/:id', adminAuth, checkPermission('homepage_stats.delete'), ctrl.removeStat);

module.exports = { publicRouter, adminRouter };
