import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  email?: string;
  password?: string;
  avatar?: string;
  provider: 'credentials' | 'google' | 'facebook';
  role: 1 | 2 | 3; // 1=admin, 2=teacher, 3=student
  fullName?: string;
  className?: string;
  school?: string;
  province?: { code: number; name: string };
  ward?: { code: number; name: string };
  address?: string;
  exp: number;
  streak: number;
  streakLastDate: string;
  studyTimeToday: number;  // accumulated seconds today
  studyTimeDate: string;  // YYYY-MM-DD (VN) of last study session
  ipAddress?: string; // IPv4/IPv6 used to locate the user on map
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
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    avatar: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'facebook'],
      default: 'credentials',
    },
    role: {
      type: Number,
      enum: [1, 2, 3],
      default: 3, // default: student
      required: true,
    },
    fullName: { type: String, trim: true },
    className: { type: String, trim: true },
    school: { type: String, trim: true },
    province: { code: { type: Number }, name: { type: String } },
    ward:     { code: { type: Number }, name: { type: String } },
    address:  { type: String, trim: true },
    exp:             { type: Number, default: 0 },
    streak:          { type: Number, default: 0 },
    streakLastDate:  { type: String, default: '' },
    studyTimeToday:  { type: Number, default: 0 },
    studyTimeDate:   { type: String, default: '' },
    ipAddress:       { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in dev environments
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
