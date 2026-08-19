const express = require('express');
const ctrl = require('./team.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listTeam);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('team.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('team.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('team.create'), ctrl.createTeamMember);
adminRouter.put('/:id', adminAuth, checkPermission('team.update'), ctrl.updateTeamMember);
adminRouter.delete('/:id', adminAuth, checkPermission('team.delete'), ctrl.removeTeamMember);

module.exports = { publicRouter, adminRouter };
