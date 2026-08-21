const express = require('express');
const ctrl = require('./appointments.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('appointments.read'), ctrl.listAppointments);
adminRouter.post('/', adminAuth, checkPermission('appointments.create'), ctrl.createAppointment);
adminRouter.put('/:id', adminAuth, checkPermission('appointments.update'), ctrl.updateAppointment);

module.exports = { adminRouter };
