import mongoose, { Schema, Document, models } from 'mongoose';

export interface IContactMessage extends Document {
  username: string;
  image?: string;      // base64 ảnh đính kèm
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  username: { type: String, required: true },
  image:    { type: String },
  content:  { type: String, required: true },
  isRead:   { type: Boolean, default: false },
}, { timestamps: true });

export default models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
