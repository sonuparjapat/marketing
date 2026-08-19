const express = require('express');
const ctrl = require('./testimonials.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listTestimonials);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('testimonials.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('testimonials.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('testimonials.create'), ctrl.createTestimonial);
adminRouter.put('/:id', adminAuth, checkPermission('testimonials.update'), ctrl.updateTestimonial);
adminRouter.delete('/:id', adminAuth, checkPermission('testimonials.delete'), ctrl.removeTestimonial);

module.exports = { publicRouter, adminRouter };
