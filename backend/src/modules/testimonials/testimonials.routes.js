const express = require('express');
const ctrl = require('./testimonials.controller');
const { adminAuth, checkPermission, customerAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listTestimonials);
publicRouter.post('/', customerAuth, ctrl.submitReview);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('testimonials.read'), ctrl.adminList);
// Registered before /:id — otherwise Express would read "homepage-eligible"/"homepage-selection"
// as an :id value for the wildcard routes below instead of matching these literal paths.
adminRouter.get('/homepage-eligible', adminAuth, checkPermission('testimonials.read'), ctrl.listEligibleForHomepage);
adminRouter.put('/homepage-selection', adminAuth, checkPermission('testimonials.update'), ctrl.setHomepageSelection);
adminRouter.get('/:id', adminAuth, checkPermission('testimonials.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('testimonials.create'), ctrl.createTestimonial);
adminRouter.put('/:id', adminAuth, checkPermission('testimonials.update'), ctrl.updateTestimonial);
adminRouter.delete('/:id', adminAuth, checkPermission('testimonials.delete'), ctrl.removeTestimonial);

module.exports = { publicRouter, adminRouter };
