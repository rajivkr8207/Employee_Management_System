import { useEffect, useReducer } from "react";
import { createNotificationSocket } from "./notificationSocket";

const initialState = { notifications: [], unreadCount: 0 };
const NOTIFICATION_LIMIT = 15;

export const notificationReducer = (state, action) => {
  switch (action.type) {
    case "sync":
      return action.data;
    case "received": {
      const current = state.notifications.find(
        ({ _id }) => _id === action.notification._id,
      );
      const unreadDelta = current
        ? Number(current.isRead && !action.notification.isRead) -
          Number(!current.isRead && action.notification.isRead)
        : Number(!action.notification.isRead);

      return {
        notifications: [
          action.notification,
          ...state.notifications.filter(
            ({ _id }) => _id !== action.notification._id,
          ),
        ].slice(0, NOTIFICATION_LIMIT),
        unreadCount: Math.max(0, state.unreadCount + unreadDelta),
      };
    }
    case "updated": {
      const current = state.notifications.find(
        ({ _id }) => _id === action.notification._id,
      );
      if (!current) {
        return { ...state, unreadCount: Math.max(0, state.unreadCount - 1) };
      }

      const unreadDelta =
        Number(current.isRead && !action.notification.isRead) -
        Number(!current.isRead && action.notification.isRead);
      return {
        notifications: state.notifications.map((notification) =>
          notification._id === action.notification._id
            ? action.notification
            : notification,
        ),
        unreadCount: Math.max(0, state.unreadCount + unreadDelta),
      };
    }
    case "read-all":
      return {
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
};

export const useNotificationCenter = (userId, token) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    if (!userId) {
      dispatch({ type: "reset" });
      return undefined;
    }

    let active = true;
    const socket = createNotificationSocket(token);

    socket.on("notification:sync", (data) => {
      if (active) dispatch({ type: "sync", data });
    });
    socket.on("notification:new", (notification) => {
      if (active) dispatch({ type: "received", notification });
    });
    socket.on("notification:updated", (notification) => {
      if (active) dispatch({ type: "updated", notification });
    });
    socket.on("notification:read-all", () => {
      if (active) dispatch({ type: "read-all" });
    });
    socket.on("connect_error", (error) => {
      if (active) {
        console.error("Live notifications are unavailable.", error);
      }
    });

    socket.connect();

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [userId, token]);

  return {
    ...state,
    markRead: (notification) => dispatch({ type: "updated", notification }),
    markAllRead: () => dispatch({ type: "read-all" }),
  };
};
