const express = require('express');
const ctrl = require('./payments.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('payments.read'), ctrl.adminList);
adminRouter.get('/:id/logs', adminAuth, checkPermission('payments.read'), ctrl.adminLogsForPayment);
adminRouter.post('/:id/refund', adminAuth, checkPermission('payments.update'), ctrl.refundPayment);

module.exports = { adminRouter };
