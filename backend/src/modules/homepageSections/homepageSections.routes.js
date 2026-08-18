const express = require('express');
const ctrl = require('./homepageSections.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listSections);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminListSections);
adminRouter.patch('/:id', adminAuth, ctrl.toggleSection);

module.exports = { publicRouter, adminRouter };
