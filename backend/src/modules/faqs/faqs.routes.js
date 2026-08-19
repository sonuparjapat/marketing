const express = require('express');
const ctrl = require('./faqs.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listFaqs);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('faqs.view'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('faqs.view'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('faqs.create'), ctrl.createFaq);
adminRouter.put('/:id', adminAuth, checkPermission('faqs.edit'), ctrl.updateFaq);
adminRouter.delete('/:id', adminAuth, checkPermission('faqs.delete'), ctrl.removeFaq);

module.exports = { publicRouter, adminRouter };
