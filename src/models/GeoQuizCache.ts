import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IQuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface IGeoQuizCache extends Document {
  bookTitle: string;
  grade: number;
  pageNumber: number;
  lessonDetected: string;
  questions: IQuizQuestion[];
  createdAt: Date;
}

const GeoQuizCacheSchema: Schema<IGeoQuizCache> = new mongoose.Schema(
  {
    bookTitle: { type: String, required: true },
    grade: { type: Number, required: true },
    pageNumber: { type: Number, required: true },
    lessonDetected: { type: String, required: true },
    questions: [
      {
        q: { type: String, required: true },
        options: [{ type: String, required: true }],
        answerIndex: { type: Number, required: true },
        explanation: { type: String, required: true }
      }
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Tạo Index ghép để truy vấn cực nhanh (Cache Key)
GeoQuizCacheSchema.index({ bookTitle: 1, grade: 1, pageNumber: 1 }, { unique: true });

const GeoQuizCache: Model<IGeoQuizCache> =
  mongoose.models.GeoQuizCache ||
  mongoose.model<IGeoQuizCache>('GeoQuizCache', GeoQuizCacheSchema);

export default GeoQuizCache;
