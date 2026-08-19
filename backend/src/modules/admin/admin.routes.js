const express = require('express');
const ctrl = require('./admin.controller');
const { adminAuth, checkPermission } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiters');
const upload = require('../../config/multer');

const router = express.Router();

router.post('/login', authLimiter, ctrl.login);
router.post('/logout', adminAuth, ctrl.logout);
router.get('/me', adminAuth, ctrl.me);
router.get('/stats', adminAuth, ctrl.stats);
router.post('/upload', adminAuth, checkPermission('media.upload'), ctrl.uploadImage);

module.exports = router;
