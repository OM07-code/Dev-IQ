import express from "express";
import { agenda } from "../lib/agenda.js";

const router = express.Router();

router.post("/clerk", async (req, res) => {
  try {
    const event = req.body;
    
    // Webhook verification via Svix is normally done here
    // But since we want it completely offline capable, we assume verification if offline
    if (process.env.OFFLINE_MODE !== "true") {
      // NOTE: In production, verify the svix headers here!
      // const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
      // wh.verify(req.body, req.headers);
    }

    if (event.type === "user.created") {
      await agenda.now("sync-user", { event });
    } else if (event.type === "user.deleted") {
      await agenda.now("delete-user-from-db", { event });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error processing clerk webhook:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
