import { Server } from "socket.io";
import { ENV } from "./env.js";

let io;

export function initSocketCli(server) {
  io = new Server(server, {
    cors: {
      origin: ENV.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected via socket:", socket.id);

    // Join a specific session room
    socket.on("join-room", (sessionId) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined room ${sessionId}`);
    });

    // Handle code changes
    socket.on("code-change", ({ sessionId, code }) => {
      // Broadcast to everyone else in the room
      socket.to(sessionId).emit("code-update", code);
    });

    // Handle language changes
    socket.on("language-change", ({ sessionId, language }) => {
      socket.to(sessionId).emit("language-update", language);
    });

    // Handle stdin state sync
    socket.on("stdin-change", ({ sessionId, stdin }) => {
      socket.to(sessionId).emit("stdin-update", stdin);
    });

    // Handle output state sync
    socket.on("output-change", ({ sessionId, output, isRunning }) => {
      socket.to(sessionId).emit("output-update", { output, isRunning });
    });

    // Handle whiteboard state sync
    socket.on("whiteboard-change", ({ sessionId, elements }) => {
      socket.to(sessionId).emit("whiteboard-update", elements);
    });

    // Interviewer adds a new problem to the queue
    socket.on("add-problem", ({ sessionId, problemsList, activeProblem }) => {
      socket.to(sessionId).emit("problems-updated", { problemsList, activeProblem });
    });

    // Interviewer switches to a different problem
    socket.on("switch-problem", ({ sessionId, activeProblem }) => {
      socket.to(sessionId).emit("problem-switched", activeProblem);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}
