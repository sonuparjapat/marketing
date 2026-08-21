const express = require('express');
const ctrl = require('./projects.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('projects.read'), ctrl.listProjects);
adminRouter.get('/:id', adminAuth, checkPermission('projects.read'), ctrl.getProject);
adminRouter.post('/', adminAuth, checkPermission('projects.create'), ctrl.createProject);
adminRouter.put('/:id', adminAuth, checkPermission('projects.update'), ctrl.updateProject);
adminRouter.delete('/:id', adminAuth, checkPermission('projects.delete'), ctrl.deleteProject);

module.exports = { adminRouter };
