import { io } from "socket.io-client";

// Initialize the socket connection to our backend
export const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
  autoConnect: false,
  withCredentials: true,
});
