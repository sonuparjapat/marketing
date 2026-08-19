const express = require('express');
const ctrl = require('./blogCategories.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listCategories);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('blog_categories.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('blog_categories.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('blog_categories.create'), ctrl.createCategory);
adminRouter.put('/:id', adminAuth, checkPermission('blog_categories.update'), ctrl.updateCategory);
adminRouter.delete('/:id', adminAuth, checkPermission('blog_categories.delete'), ctrl.removeCategory);

module.exports = { publicRouter, adminRouter };
