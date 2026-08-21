const express = require('express');
const ctrl = require('./clients.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('clients.read'), ctrl.listClients);
adminRouter.get('/:id', adminAuth, checkPermission('clients.read'), ctrl.getClient);
adminRouter.post('/', adminAuth, checkPermission('clients.create'), ctrl.createClient);
adminRouter.put('/:id', adminAuth, checkPermission('clients.update'), ctrl.updateClient);
adminRouter.delete('/:id', adminAuth, checkPermission('clients.delete'), ctrl.deleteClient);

module.exports = { adminRouter };
