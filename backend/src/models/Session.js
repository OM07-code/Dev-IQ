import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // array of problem IDs pushed into the session
    problemsList: {
      type: [String],
      default: [],
    },
    activeProblem: {
      type: String,
      default: "",
    },
    // stream video call ID
    callId: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    codeSnapshot: {
      type: String,
      default: "",
    },
    // Maps problem ID -> latest code string
    codeSnapshots: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
