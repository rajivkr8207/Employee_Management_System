import { io } from "socket.io-client";
import { Config } from "../../config/Config";

export const createNotificationSocket = (token) =>
  io(Config.BACKEND_URL || window.location.origin, {
    autoConnect: false,
    withCredentials: true,
    auth: token ? { token } : {},
  });
