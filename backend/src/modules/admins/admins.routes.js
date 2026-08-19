const express = require('express');
const { listAdmins, createAdmin, updateAdmin, resetPassword } = require('./admins.controller');
const { adminAuth, requireSuperAdmin } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.use(adminAuth, requireSuperAdmin);
adminRouter.get('/', listAdmins);
adminRouter.post('/', createAdmin);
adminRouter.patch('/:id', updateAdmin);
adminRouter.patch('/:id/password', resetPassword);

module.exports = { adminRouter };
