import { NotificationModel } from './notification.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  actionUrl = '',
}) => {
  return NotificationModel.create({
    userId,
    title,
    message,
    type,
    actionUrl,
  });
};

export const getUserNotifications = async (userId, { isRead, limit = 20 } = {}) => {
  const filter = { userId };
  if (typeof isRead === 'boolean') filter.isRead = isRead;
  return NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100));
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return notification;
};

export const markAllAsRead = async (userId) => {
  await NotificationModel.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  return { message: 'All notifications marked as read' };
};

export const getUnreadCount = async (userId) => {
  const count = await NotificationModel.countDocuments({ userId, isRead: false });
  return { unreadCount: count };
};
