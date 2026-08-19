const express = require('express');
const { listDocs, getDoc, updateDoc } = require('./docs.controller');
const { adminAuth } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.use(adminAuth);
adminRouter.get('/', listDocs);
adminRouter.get('/:type', getDoc);
adminRouter.put('/:type', updateDoc);

module.exports = { adminRouter };
