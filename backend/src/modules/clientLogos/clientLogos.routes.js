const express = require('express');
const ctrl = require('./clientLogos.controller');
const { adminAuth } = require('../../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', ctrl.listLogos);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, ctrl.adminList);
adminRouter.get('/:id', adminAuth, ctrl.adminGetOne);
adminRouter.post('/', adminAuth, ctrl.createLogo);
adminRouter.put('/:id', adminAuth, ctrl.updateLogo);
adminRouter.delete('/:id', adminAuth, ctrl.removeLogo);

module.exports = { publicRouter, adminRouter };
