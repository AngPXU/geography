import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeoQuestion extends Document {
  question: string;          // Câu hỏi "Vì sao..."
  answer: string;            // Giải thích chi tiết
  topic: string;             // Chủ đề (Địa hình, Khí hậu, Đại dương, ...)
  region: string;            // Khu vực địa lý (Châu Á, Châu Phi, ...)
  funFact: string;           // 1 sự thật thú vị ngắn
  tags: string[];            // Tags tìm kiếm
  generatedAt: Date;         // Giờ sinh
  session: '00:00' | '12:00'; // Ca sáng hay nửa đêm
}

const GeoQuestionSchema: Schema<IGeoQuestion> = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer:   { type: String, required: true },
    topic:    { type: String, required: true },
    region:   { type: String, required: true },
    funFact:  { type: String, required: true },
    tags:     { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
    session: { type: String, enum: ['00:00', '12:00'], required: true },
  },
  { timestamps: true }
);

const GeoQuestion: Model<IGeoQuestion> =
  mongoose.models.GeoQuestion ||
  mongoose.model<IGeoQuestion>('GeoQuestion', GeoQuestionSchema);

export default GeoQuestion;
