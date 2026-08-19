const express = require('express');
const { listDepartments, createDepartment, updateDepartment, deleteDepartment } = require('./departments.controller');
const { adminAuth, requireSuperAdmin } = require('../../middleware/auth');

const adminRouter = express.Router();
adminRouter.use(adminAuth, requireSuperAdmin);
adminRouter.get('/', listDepartments);
adminRouter.post('/', createDepartment);
adminRouter.put('/:id', updateDepartment);
adminRouter.delete('/:id', deleteDepartment);

module.exports = { adminRouter };
