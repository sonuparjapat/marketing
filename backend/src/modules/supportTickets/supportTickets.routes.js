const express = require('express');
const ctrl = require('./supportTickets.controller');
const { adminAuth, checkPermission, customerAuth } = require('../../middleware/auth');

const customerRouter = express.Router();
customerRouter.use(customerAuth);
customerRouter.post('/', ctrl.createTicket);
customerRouter.get('/', ctrl.listMyTickets);
customerRouter.get('/:id', ctrl.getMyTicket);
customerRouter.post('/:id/messages', ctrl.replyToMyTicket);

const adminRouter = express.Router();
adminRouter.get('/', adminAuth, checkPermission('support_tickets.read'), ctrl.adminListTickets);
adminRouter.get('/:id', adminAuth, checkPermission('support_tickets.read'), ctrl.adminGetTicket);
adminRouter.post('/:id/messages', adminAuth, checkPermission('support_tickets.update'), ctrl.adminReplyToTicket);
adminRouter.patch('/:id', adminAuth, checkPermission('support_tickets.update'), ctrl.adminUpdateTicketStatus);

module.exports = { customerRouter, adminRouter };
