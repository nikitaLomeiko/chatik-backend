import mongoose from "mongoose";

const User = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, require: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

User.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", User);
