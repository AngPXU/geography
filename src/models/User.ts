import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  avatar?: string;
  provider: 'credentials' | 'google' | 'facebook';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Only enforces uniqueness if it exists
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Not required for OAuth
    },
    avatar: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'facebook'],
      default: 'credentials',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in dev environments
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
