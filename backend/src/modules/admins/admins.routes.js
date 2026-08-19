const express = require('express');
const { listAdmins, createAdmin, setActive } = require('./admins.controller');
const { adminAuth, requireSuperAdmin } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.use(adminAuth, requireSuperAdmin);
adminRouter.get('/', listAdmins);
adminRouter.post('/', createAdmin);
adminRouter.patch('/:id', setActive);

module.exports = { adminRouter };
