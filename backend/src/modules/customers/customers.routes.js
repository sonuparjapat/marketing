const express = require('express');
const ctrl = require('./customers.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('customers.read'), ctrl.listCustomers);
adminRouter.get('/:id', adminAuth, checkPermission('customers.read'), ctrl.getCustomer);
adminRouter.patch('/:id', adminAuth, checkPermission('customers.update'), ctrl.updateCustomer);

module.exports = { adminRouter };
