const express = require('express');
const ctrl = require('./documents.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');
const { uploadDocument } = require('../../config/multer');

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('documents.read'), ctrl.listDocuments);
adminRouter.post('/upload', adminAuth, checkPermission('documents.create'), uploadDocument.single('file'), ctrl.uploadDocument);
adminRouter.delete('/:id', adminAuth, checkPermission('documents.delete'), ctrl.deleteDocument);

module.exports = { adminRouter };
