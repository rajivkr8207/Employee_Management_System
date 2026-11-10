import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  broadcastNotification,
} from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
  const notifications = await getUserNotifications(req.user.id, {
    isRead,
    limit: req.query.limit,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { notifications }, 'Notifications fetched successfully'));
});

export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const result = await getUnreadCount(req.user.id);
  return res.status(200).json(new ApiResponse(200, result, 'Unread count fetched successfully'));
});

export const readNotification = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id, req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  const result = await markAllAsRead(req.user.id);
  return res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
});

export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { organizationId, storeId, title, message, type, actionUrl } = req.body;
  if (!organizationId) throw new ApiError(400, 'Organization ID is required');
  if (!title?.trim() || !message?.trim()) {
    throw new ApiError(400, 'Notification title and message are required');
  }

  const result = await broadcastNotification({
    senderUser: req.user,
    organizationId,
    storeId,
    title: title.trim(),
    message: message.trim(),
    type: type || 'announcement',
    actionUrl: actionUrl?.trim() || '',
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, 'Broadcast notification sent successfully'));
});
