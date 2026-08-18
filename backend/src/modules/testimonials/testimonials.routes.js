const express = require('express');
const ctrl = require('./testimonials.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listTestimonials);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createTestimonial);
adminRouter.put('/:id', adminAuth, ctrl.updateTestimonial);
adminRouter.delete('/:id', adminAuth, ctrl.removeTestimonial);

module.exports = { publicRouter, adminRouter };
