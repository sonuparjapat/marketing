const express = require('express');
const { listMedia, removeMedia } = require('./media.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('media.view'), listMedia);
adminRouter.delete('/:id', adminAuth, checkPermission('media.delete'), removeMedia);

module.exports = { adminRouter };
