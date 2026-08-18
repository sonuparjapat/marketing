const express = require('express');
const ctrl = require('./pages.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/:slug', ctrl.getPage);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.put('/:id', adminAuth, ctrl.updatePage);

module.exports = { publicRouter, adminRouter };
