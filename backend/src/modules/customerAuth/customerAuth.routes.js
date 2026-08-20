const express = require('express');
const ctrl = require('./customerAuth.controller');
const { customerAuth } = require('../../middleware/auth');
const { customerAuthLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/register', customerAuthLimiter, ctrl.register);
publicRouter.post('/login', customerAuthLimiter, ctrl.login);
publicRouter.post('/logout', ctrl.logout);
publicRouter.get('/me', customerAuth, ctrl.me);
publicRouter.post('/forgot-password', customerAuthLimiter, ctrl.forgotPassword);
publicRouter.post('/reset-password', customerAuthLimiter, ctrl.resetPassword);
publicRouter.get('/export', customerAuth, ctrl.exportData);
publicRouter.delete('/me', customerAuth, ctrl.deleteAccount);

module.exports = { publicRouter };
