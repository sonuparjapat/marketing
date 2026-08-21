const express = require('express');
const ctrl = require('./invoices.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('invoices.read'), ctrl.listInvoices);
adminRouter.get('/:id', adminAuth, checkPermission('invoices.read'), ctrl.getInvoice);
adminRouter.post('/', adminAuth, checkPermission('invoices.create'), ctrl.createInvoice);
adminRouter.post('/:id/send', adminAuth, checkPermission('invoices.update'), ctrl.sendInvoice);
adminRouter.post('/:id/mark-paid', adminAuth, checkPermission('invoices.update'), ctrl.markPaidManual);
adminRouter.post('/:id/cancel', adminAuth, checkPermission('invoices.update'), ctrl.cancelInvoice);

module.exports = { adminRouter };
