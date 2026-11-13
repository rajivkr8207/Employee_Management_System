import { api } from "../../lib/api";

export const notificationService = {
  loadNotificationData: async () => {
    const [notificationsResponse, unreadResponse] = await Promise.all([
      api.get("/notifications", { params: { limit: 15 } }),
      api.get("/notifications/unread-count"),
    ]);

    return {
      notifications: notificationsResponse.data?.data?.notifications || [],
      unreadCount: unreadResponse.data?.data?.unreadCount || 0,
    };
  },
  getNotifications: (params) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
  broadcastNotification: (data) => api.post("/notifications/broadcast", data),
};
