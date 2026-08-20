const express = require('express');
const ctrl = require('./subscriptionPlans.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listActivePlans);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('subscription_plans.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('subscription_plans.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('subscription_plans.create'), ctrl.createPlan);
adminRouter.put('/:id', adminAuth, checkPermission('subscription_plans.update'), ctrl.updatePlan);
adminRouter.post('/:id/duplicate', adminAuth, checkPermission('subscription_plans.create'), ctrl.duplicatePlan);

module.exports = { publicRouter, adminRouter };
