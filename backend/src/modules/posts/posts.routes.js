const express = require('express');
const ctrl = require('./posts.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listPosts);
publicRouter.get('/:slug', ctrl.getPost);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createPost);
adminRouter.put('/:id', adminAuth, ctrl.updatePost);
adminRouter.delete('/:id', adminAuth, ctrl.removePost);

module.exports = { publicRouter, adminRouter };
