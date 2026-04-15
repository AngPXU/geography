import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  classroomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 1 | 2 | 3; // 1=admin, 2=teacher, 3=student
  text: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  likes: string[]; // array of userIds
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    classroomId: { type: String, required: true, index: true },
    senderId:    { type: String, required: true },
    senderName:  { type: String, required: true },
    senderAvatar:{ type: String },
    senderRole:  { type: Number, enum: [1, 2, 3], default: 3 },
    text:        { type: String, required: true, trim: true, maxlength: 1000 },
    replyTo: {
      messageId: { type: String },
      senderName:{ type: String },
      text:      { type: String },
    },
    likes: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Index for efficient per-classroom queries
ChatMessageSchema.index({ classroomId: 1, createdAt: -1 });

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
