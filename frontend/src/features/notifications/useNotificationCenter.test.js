import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { createSocket } = vi.hoisted(() => ({
  createSocket: vi.fn(),
}));

vi.mock("./notificationSocket", () => ({
  createNotificationSocket: createSocket,
}));

import {
  notificationReducer,
  useNotificationCenter,
} from "./useNotificationCenter";

const notification = (id, isRead = false) => ({ _id: id, isRead });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("notificationReducer", () => {
  it("deduplicates received notifications and keeps unread counts in sync", () => {
    const initial = {
      notifications: [notification("existing")],
      unreadCount: 1,
    };

    const duplicate = notificationReducer(initial, {
      type: "received",
      notification: notification("existing"),
    });
    expect(duplicate.unreadCount).toBe(1);

    const added = notificationReducer(duplicate, {
      type: "received",
      notification: notification("new"),
    });
    expect(added.notifications[0]._id).toBe("new");
    expect(added.unreadCount).toBe(2);
  });

  it("applies read and read-all socket updates idempotently", () => {
    const initial = {
      notifications: [notification("first"), notification("second")],
      unreadCount: 2,
    };
    const oneRead = notificationReducer(initial, {
      type: "updated",
      notification: notification("first", true),
    });

    expect(oneRead.unreadCount).toBe(1);
    expect(
      notificationReducer(oneRead, {
        type: "updated",
        notification: notification("first", true),
      }).unreadCount,
    ).toBe(1);

    const allRead = notificationReducer(oneRead, { type: "read-all" });
    expect(allRead.unreadCount).toBe(0);
    expect(allRead.notifications.every(({ isRead }) => isRead)).toBe(true);
  });
});

describe("useNotificationCenter", () => {
  it("loads notifications from the Socket.IO sync event", () => {
    const handlers = {};
    const socket = {
      on: vi.fn((event, handler) => {
        handlers[event] = handler;
        return socket;
      }),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    createSocket.mockReturnValue(socket);

    const { result } = renderHook(() =>
      useNotificationCenter("user-1", "token"),
    );
    const syncData = {
      notifications: [notification("existing")],
      unreadCount: 1,
    };
    act(() => {
      handlers["notification:sync"](syncData);
    });

    expect(result.current).toMatchObject(syncData);
    expect(socket.connect).toHaveBeenCalledOnce();
  });
});
