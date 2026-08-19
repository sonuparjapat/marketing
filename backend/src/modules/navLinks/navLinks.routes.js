const express = require('express');
const ctrl = require('./navLinks.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listNavLinks);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('nav_links.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('nav_links.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('nav_links.create'), ctrl.createNavLink);
adminRouter.put('/:id', adminAuth, checkPermission('nav_links.update'), ctrl.updateNavLink);
adminRouter.delete('/:id', adminAuth, checkPermission('nav_links.delete'), ctrl.removeNavLink);

module.exports = { publicRouter, adminRouter };
