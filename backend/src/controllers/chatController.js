import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    // use mongo _id for Stream
    const token = chatClient.createToken(req.user._id.toString());

    res.status(200).json({
      token,
      userId: req.user._id.toString(),
      userName: req.user.name,
      userImage: req.user.profileImage,
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
