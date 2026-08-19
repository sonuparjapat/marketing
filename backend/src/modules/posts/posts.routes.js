const express = require('express');
const ctrl = require('./posts.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listPosts);
publicRouter.get('/:slug', ctrl.getPost);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('posts.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('posts.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('posts.create'), ctrl.createPost);
adminRouter.put('/:id', adminAuth, checkPermission('posts.update'), ctrl.updatePost);
adminRouter.delete('/:id', adminAuth, checkPermission('posts.delete'), ctrl.removePost);

module.exports = { publicRouter, adminRouter };
