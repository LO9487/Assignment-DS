import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: String,
  bio: String,
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },
  ],
  onboarded: {
    type: Boolean,
    default: false,
  },
  interactions: [
    {
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Thread",
      },
      interactionType: {
        type: String,
        enum: ["like", "comment"],
      },
    },
  ],
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },
  ], // Add replies field
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
