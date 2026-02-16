import mongoose from "mongoose";

const Chat = new mongoose.Schema({
  dataId: { type: Number, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomname: { type: String, required: true },
});

export default mongoose.model("Chat", Chat);
