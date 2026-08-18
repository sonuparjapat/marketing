const express = require('express');
const ctrl = require('./whyUs.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listWhyUs);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createPoint);
adminRouter.put('/:id', adminAuth, ctrl.updatePoint);
adminRouter.delete('/:id', adminAuth, ctrl.removePoint);

module.exports = { publicRouter, adminRouter };
