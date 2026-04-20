import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IScreenSignal extends Document {
  classroomId: string;
  senderUsername: string;
  targetUsername?: string;
  type: 'announce' | 'request-offer' | 'offer' | 'answer' | 'ice-candidate' | 'stop';
  payload: any;
  createdAt: Date;
}

const ScreenSignalSchema: Schema<IScreenSignal> = new mongoose.Schema({
  classroomId:    { type: String, required: true, index: true },
  senderUsername: { type: String, required: true },
  targetUsername: { type: String },
  type:           { type: String, required: true, enum: ['announce', 'request-offer', 'offer', 'answer', 'ice-candidate', 'stop'] },
  payload:        { type: Schema.Types.Mixed },
  createdAt:      { type: Date, default: Date.now, expires: 120 },
});

// Delete cached model so schema changes (enum) take effect on hot-reload
if (mongoose.models.ScreenSignal) delete (mongoose.models as any).ScreenSignal;

const ScreenSignal: Model<IScreenSignal> =
  mongoose.model<IScreenSignal>('ScreenSignal', ScreenSignalSchema);

export default ScreenSignal;
