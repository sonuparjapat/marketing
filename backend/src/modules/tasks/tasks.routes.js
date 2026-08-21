const express = require('express');
const ctrl = require('./tasks.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

// Gated by 'projects.*' — no separate 'tasks' permission key, same precedent as ticket_messages
// having none of its own (a task only ever exists in the context of its parent project).
const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('projects.read'), ctrl.listTasks);
adminRouter.post('/', adminAuth, checkPermission('projects.update'), ctrl.createTask);
adminRouter.patch('/reorder', adminAuth, checkPermission('projects.update'), ctrl.reorderTasks);
adminRouter.put('/:id', adminAuth, checkPermission('projects.update'), ctrl.updateTask);
adminRouter.delete('/:id', adminAuth, checkPermission('projects.update'), ctrl.deleteTask);

module.exports = { adminRouter };
