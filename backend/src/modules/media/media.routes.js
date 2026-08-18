const express = require('express');
const { listMedia, removeMedia } = require('./media.controller');
const { adminAuth } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, listMedia);
adminRouter.delete('/:id', adminAuth, removeMedia);

module.exports = { adminRouter };
