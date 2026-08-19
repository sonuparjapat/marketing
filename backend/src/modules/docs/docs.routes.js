const express = require('express');
const { listDocs, getDoc, updateDoc } = require('./docs.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');

// Public — used for the "share to anyone" link (no login required). Deliberately
// excluded from the sitemap and marked noindex on the frontend (see docs/[type]/page.tsx) —
// reachable by anyone with the link, but not meant to show up in search results.
const publicRouter = express.Router();
publicRouter.get('/:type', getDoc);

const adminRouter = express.Router();
adminRouter.use(adminAuth);
adminRouter.get('/', checkPermission('docs.view'), listDocs);
adminRouter.get('/:type', checkPermission('docs.view'), getDoc);
adminRouter.put('/:type', checkPermission('docs.edit'), updateDoc);

module.exports = { publicRouter, adminRouter };
