const express = require('express');
const ctrl = require('./subscriptions.controller');
const { customerAuth } = require('../../middleware/auth');
const { customerAuthLimiter } = require('../../middleware/rateLimiters');

const router = express.Router();
router.post('/checkout', customerAuth, customerAuthLimiter, ctrl.checkout);
router.post('/verify', customerAuth, customerAuthLimiter, ctrl.verify);
router.get('/me', customerAuth, ctrl.mySubscriptions);

module.exports = { router };
