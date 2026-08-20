const express = require('express');
const ctrl = require('./posts.controller');
const { adminAuth, checkPermission, customerAuth, optionalCustomerAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listPosts);
publicRouter.get('/tags', ctrl.listTags); // must come before /:slug or "tags" is read as a slug
publicRouter.get('/:slug', optionalCustomerAuth, ctrl.getPost);
publicRouter.get('/:slug/full-content', customerAuth, ctrl.getFullContent);
publicRouter.get('/:slug/my-vote', customerAuth, ctrl.getMyPostVote);
publicRouter.post('/:slug/vote', customerAuth, ctrl.voteOnPost);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('posts.read'), ctrl.adminList);
adminRouter.get('/:id', adminAuth, checkPermission('posts.read'), ctrl.adminGetOne);
adminRouter.post('/', adminAuth, checkPermission('posts.create'), ctrl.createPost);
adminRouter.put('/:id', adminAuth, checkPermission('posts.update'), ctrl.updatePost);
adminRouter.delete('/:id', adminAuth, checkPermission('posts.delete'), ctrl.removePost);

module.exports = { publicRouter, adminRouter };
