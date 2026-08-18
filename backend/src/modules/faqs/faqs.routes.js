const express = require('express');
const ctrl = require('./faqs.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listFaqs);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createFaq);
adminRouter.put('/:id', adminAuth, ctrl.updateFaq);
adminRouter.delete('/:id', adminAuth, ctrl.removeFaq);

module.exports = { publicRouter, adminRouter };
