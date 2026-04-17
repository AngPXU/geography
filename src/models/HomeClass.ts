import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHomeClassMember {
  userId: mongoose.Types.ObjectId;
  username: string;
  fullName?: string;
  avatar?: string;
  joinedAt: Date;
}

export interface IHomeClass extends Document {
  name: string;
  subject?: string;
  description?: string;
  grade?: number;
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  teacherAvatar?: string;
  members: IHomeClassMember[];
  createdAt: Date;
  updatedAt: Date;
}

const HomeClassSchema = new Schema<IHomeClass>(
  {
    name:          { type: String, required: true, trim: true },
    subject:       { type: String, trim: true },
    description:   { type: String, trim: true },
    grade:         { type: Number },
    teacherId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName:   { type: String, required: true },
    teacherAvatar: { type: String },
    members: [
      {
        userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
        username:  { type: String, required: true },
        fullName:  { type: String },
        avatar:    { type: String },
        joinedAt:  { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const HomeClass: Model<IHomeClass> =
  mongoose.models.HomeClass || mongoose.model<IHomeClass>('HomeClass', HomeClassSchema);

export default HomeClass;
