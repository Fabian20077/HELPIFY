import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  addComment
} from '../controllers/ticket.controller';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  addCommentSchema
} from '../validators/ticket.validator';

const router = Router();

// Todas las rutas de tickets requieren autenticación
router.use(requireAuth);

router.post('/', validateRequest(createTicketSchema), createTicket as any);
router.get('/', getTickets as any);
router.get('/:id', getTicketById as any);

// Solo agentes, managers o admins pueden cambiar los estados libremente o asignar.
// (Los customers solo podrían tener acceso a un endpoint específico para cancelar/resolver)
router.patch('/:id/status', requireRole(['agent', 'admin', 'manager']), validateRequest(updateTicketStatusSchema), updateTicketStatus as any);

// Comentarios
router.post('/:id/comments', validateRequest(addCommentSchema), addComment as any);

export default router;
