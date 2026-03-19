import { Router } from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import ticketRoutes from './ticket.routes';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import notificationRoutes from './notification.routes';
import attachmentRoutes from './attachment.routes';

const apiRouter = Router();

// ============================================================================
// AQUÍ SE REGISTRARÁN TODAS LAS RUTAS DE LA API
// ============================================================================

apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/attachments', attachmentRoutes);





export default apiRouter;
