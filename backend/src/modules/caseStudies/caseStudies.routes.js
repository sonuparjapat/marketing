const express = require('express');
const ctrl = require('./caseStudies.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listCaseStudies);
publicRouter.get('/:slug', ctrl.getCaseStudy);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('case_studies.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('case_studies.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('case_studies.create'), ctrl.createCaseStudy);
adminRouter.put('/:id', adminAuth, checkPermission('case_studies.update'), ctrl.updateCaseStudy);
adminRouter.delete('/:id', adminAuth, checkPermission('case_studies.delete'), ctrl.removeCaseStudy);

module.exports = { publicRouter, adminRouter };
