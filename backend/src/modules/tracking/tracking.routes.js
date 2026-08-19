const express = require('express');
const { trackPageview } = require('./tracking.controller');

const publicRouter = express.Router();
publicRouter.post('/pageview', trackPageview);

module.exports = { publicRouter };
