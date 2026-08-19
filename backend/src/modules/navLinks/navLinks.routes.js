const express = require('express');
const ctrl = require('./navLinks.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listNavLinks);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('nav_links.view'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('nav_links.view'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('nav_links.create'), ctrl.createNavLink);
adminRouter.put('/:id', adminAuth, checkPermission('nav_links.edit'), ctrl.updateNavLink);
adminRouter.delete('/:id', adminAuth, checkPermission('nav_links.delete'), ctrl.removeNavLink);

module.exports = { publicRouter, adminRouter };
