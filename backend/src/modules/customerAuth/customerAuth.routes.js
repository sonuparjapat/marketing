const express = require('express');
const ctrl = require('./customerAuth.controller');
const { customerAuth } = require('../../middleware/auth');
const { customerAuthLimiter } = require('../../middleware/rateLimiters');

const publicRouter = express.Router();
publicRouter.post('/register', customerAuthLimiter, ctrl.register);
publicRouter.post('/login', customerAuthLimiter, ctrl.login);
publicRouter.post('/logout', ctrl.logout);
publicRouter.get('/me', customerAuth, ctrl.me);

module.exports = { publicRouter };
