const express = require('express');
const ctrl = require('./team.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listTeam);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createTeamMember);
adminRouter.put('/:id', adminAuth, ctrl.updateTeamMember);
adminRouter.delete('/:id', adminAuth, ctrl.removeTeamMember);

module.exports = { publicRouter, adminRouter };
