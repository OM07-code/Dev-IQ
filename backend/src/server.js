import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { initSocketCli } from "./lib/socket.js";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import authRoute from "./routes/authRoute.js";
import executeRoute from "./routes/executeRoute.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocketCli(server);

const __dirname = path.resolve();

// middleware
app.use(express.json());
app.use(cookieParser());
// credentials:true meaning?? => server allows a browser to include cookies on request
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/execute", executeRoute);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    server.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
