import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeoAiCache extends Document {
  hash: string;
  question: string;
  answer: string;
  personaId: string;
  bookTitle: string;
  pageNumber: number;
  createdAt: Date;
}

const GeoAiCacheSchema: Schema<IGeoAiCache> = new mongoose.Schema(
  {
    hash: { type: String, required: true, unique: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    personaId: { type: String, required: true },
    bookTitle: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // Tự động xóa sau 30 ngày để dọn dẹp
  },
  { timestamps: false }
);

const GeoAiCache: Model<IGeoAiCache> =
  mongoose.models.GeoAiCache ||
  mongoose.model<IGeoAiCache>('GeoAiCache', GeoAiCacheSchema);

export default GeoAiCache;
