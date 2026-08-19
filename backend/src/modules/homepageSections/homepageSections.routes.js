const express = require('express');
const ctrl = require('./homepageSections.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listSections);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('homepage_sections.view'), ctrl.adminListSections);
adminRouter.patch('/:id', adminAuth, checkPermission('homepage_sections.edit'), ctrl.toggleSection);

module.exports = { publicRouter, adminRouter };
