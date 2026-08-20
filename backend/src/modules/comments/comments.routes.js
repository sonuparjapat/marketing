const express = require('express');
const ctrl = require('./comments.controller');
const { adminAuth, checkPermission, customerAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/:slug', ctrl.listComments);
publicRouter.post('/:slug', customerAuth, ctrl.createComment);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('comments.read'), ctrl.adminListComments);
adminRouter.delete('/:id', adminAuth, checkPermission('comments.delete'), ctrl.removeComment);

module.exports = { publicRouter, adminRouter };
