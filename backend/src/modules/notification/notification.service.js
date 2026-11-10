import { NotificationModel } from './notification.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/roles.js';
import { MembershipModel } from '../membership/membership.model.js';
import { organizationModel } from '../organization/organization.model.js';
import { authorizeOrganizationAccess } from '../membership/membership.service.js';

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

export const broadcastNotification = async ({
  senderUser,
  organizationId,
  storeId,
  title,
  message,
  type = 'announcement',
  actionUrl = '',
}) => {
  if (![ROLES.STORE_ADMIN, ROLES.ADMIN].includes(senderUser.role)) {
    throw new ApiError(403, 'Only Store Administrators and Admins can broadcast notifications');
  }

  if (senderUser.role !== ROLES.ADMIN) {
    await authorizeOrganizationAccess({
      userId: senderUser.id,
      organizationId,
      storeId: storeId || undefined,
      allowedRoles: ['owner', 'store_admin'],
    });
  }

  const filter = { organizationId, status: 'active' };
  if (storeId) {
    filter.storeIds = storeId;
  }

  const memberships = await MembershipModel.find(filter).select('userId');
  const recipientIds = new Set(memberships.map((m) => m.userId.toString()));

  const org = await organizationModel.findById(organizationId).select('ownerId');
  if (org?.ownerId) {
    recipientIds.add(org.ownerId.toString());
  }

  const docs = Array.from(recipientIds).map((userId) => ({
    userId,
    senderId: senderUser.id,
    organizationId,
    storeId: storeId || null,
    title,
    message,
    type,
    actionUrl,
  }));

  if (docs.length > 0) {
    await NotificationModel.insertMany(docs);
  }

  return { count: docs.length };
};

export const notifyStoreAdminsOnAttendance = async ({
  organizationId,
  storeId,
  employeeName,
  type,
  timeStr,
  storeName,
}) => {
  try {
    const org = await organizationModel.findById(organizationId).select('ownerId');
    const adminMemberships = await MembershipModel.find({
      organizationId,
      role: { $in: ['store_admin', 'manager'] },
      ...(storeId ? { storeIds: storeId } : {}),
      status: 'active',
    }).select('userId');

    const adminIds = new Set(adminMemberships.map((m) => m.userId.toString()));
    if (org?.ownerId) adminIds.add(org.ownerId.toString());

    const action = type === 'checkIn' ? 'checked in' : 'checked out';
    const title = `${type === 'checkIn' ? 'Check-in' : 'Check-out'}: ${employeeName}`;
    const message = `${employeeName} ${action} at ${timeStr} (${storeName}).`;

    const docs = Array.from(adminIds).map((userId) => ({
      userId,
      organizationId,
      storeId: storeId || null,
      title,
      message,
      type: 'attendance',
      actionUrl: '/admin/attendance',
    }));

    if (docs.length > 0) {
      await NotificationModel.insertMany(docs);
    }
  } catch {
    // Non-blocking notification dispatch
  }
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
