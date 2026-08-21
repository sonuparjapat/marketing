const express = require('express');
const ctrl = require('./notifications.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('notifications.read'), ctrl.listNotifications);
adminRouter.patch('/mark-all-read', adminAuth, checkPermission('notifications.read'), ctrl.markAllRead);
adminRouter.patch('/:id/read', adminAuth, checkPermission('notifications.read'), ctrl.markRead);

module.exports = { adminRouter };
