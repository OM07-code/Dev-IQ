import mongoose from "mongoose";
import { connectDB } from "./src/lib/db.js";
import User from "./src/models/User.js";

async function run() {
  await connectDB();
  try {
    await User.collection.dropIndex("clerkId_1");
    console.log("clerkId_1 index dropped successfully.");
  } catch (err) {
    if (err.code === 27) {
      console.log("Index not found, continuing.");
    } else {
      console.log("Error dropping index:", err);
    }
  }
  process.exit(0);
}

run();
