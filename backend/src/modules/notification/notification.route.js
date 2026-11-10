import { Router } from 'express';
import { verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  getNotifications,
  getUnreadNotificationCount,
  readNotification,
  readAllNotifications,
} from './notification.controller.js';

const notificationRouter = Router();

notificationRouter.use(verifyJWT);

notificationRouter.get('/', getNotifications);
notificationRouter.get('/unread-count', getUnreadNotificationCount);
notificationRouter.patch('/read-all', readAllNotifications);
notificationRouter.patch('/:id/read', readNotification);

export default notificationRouter;
