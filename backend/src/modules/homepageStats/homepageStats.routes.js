const express = require('express');
const ctrl = require('./homepageStats.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listStats);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createStat);
adminRouter.put('/:id', adminAuth, ctrl.updateStat);
adminRouter.delete('/:id', adminAuth, ctrl.removeStat);

module.exports = { publicRouter, adminRouter };
