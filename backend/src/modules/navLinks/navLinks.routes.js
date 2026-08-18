const express = require('express');
const ctrl = require('./navLinks.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listNavLinks);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createNavLink);
adminRouter.put('/:id', adminAuth, ctrl.updateNavLink);
adminRouter.delete('/:id', adminAuth, ctrl.removeNavLink);

module.exports = { publicRouter, adminRouter };
