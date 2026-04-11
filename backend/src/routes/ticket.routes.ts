import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addComment,
  assignTicket,
  deleteTicket,
  addObserver,
  removeObserver
} from '../controllers/ticket.controller';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  addCommentSchema,
  assignTicketSchema
} from '../validators/ticket.validator';

const router = Router();

// Todas las rutas de tickets requieren autenticación
router.use(requireAuth);

router.post('/', validateRequest(createTicketSchema), createTicket as any);
router.get('/', getTickets as any);
router.get('/:id', getTicketById as any);

// Solo agentes, managers o admins pueden cambiar los estados libremente o asignar.
router.patch('/:id/status', requireRole(['agent', 'admin', 'manager']), validateRequest(updateTicketStatusSchema), updateTicketStatus as any);
router.patch('/:id/assign', requireRole(['agent', 'admin', 'manager']), validateRequest(assignTicketSchema), assignTicket as any);
router.delete('/:id', requireRole(['admin']), deleteTicket as any);

// Observadores
router.post('/:id/observers', requireRole(['agent', 'admin', 'manager']), addObserver as any);
router.delete('/:id/observers/:userId', requireRole(['agent', 'admin', 'manager']), removeObserver as any);

// Comentarios
router.post('/:id/comments', validateRequest(addCommentSchema), addComment as any);

export default router;
