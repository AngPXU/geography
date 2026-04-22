import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  recipientId: string;
  senderId?: string;
  type: 'NEW_ASSIGNMENT' | 'SUBMITTED_ASSIGNMENT' | 'GRADED_ASSIGNMENT' | 'LIVE_CLASS_STARTED' | 'CLASS_JOIN' | 'ARENA_INVITE' | 'GENERAL';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true, index: true },
    senderId:    { type: String },
    type:        { type: String, required: true },
    title:       { type: String, required: true },
    message:     { type: String, required: true },
    link:        { type: String },
    isRead:      { type: Boolean, default: false },
    createdAt:   { type: Date, default: Date.now }
  },
  { timestamps: false }
);

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
