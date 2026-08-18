const express = require('express');
const ctrl = require('./caseStudies.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listCaseStudies);
publicRouter.get('/:slug', ctrl.getCaseStudy);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createCaseStudy);
adminRouter.put('/:id', adminAuth, ctrl.updateCaseStudy);
adminRouter.delete('/:id', adminAuth, ctrl.removeCaseStudy);

module.exports = { publicRouter, adminRouter };
