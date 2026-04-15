import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeoFunFact extends Document {
  headline: string;      // Tiêu đề ngắn gọn, gây sốc/tò mò
  detail: string;        // Giải thích chi tiết 3-5 câu
  whyItMatters: string;  // Tại sao điều này quan trọng / ý nghĩa địa lý
  topic: string;
  region: string;
  emoji: string;         // Emoji đại diện
  tags: string[];
  generatedAt: Date;
  session: '00:00' | '12:00';
}

const GeoFunFactSchema: Schema<IGeoFunFact> = new mongoose.Schema(
  {
    headline:      { type: String, required: true },
    detail:        { type: String, required: true },
    whyItMatters:  { type: String, required: true },
    topic:         { type: String, required: true },
    region:        { type: String, required: true },
    emoji:         { type: String, default: '🌍' },
    tags:          { type: [String], default: [] },
    generatedAt:   { type: Date, default: Date.now },
    session:       { type: String, enum: ['00:00', '12:00'], required: true },
  },
  { timestamps: true }
);

const GeoFunFact: Model<IGeoFunFact> =
  mongoose.models.GeoFunFact ||
  mongoose.model<IGeoFunFact>('GeoFunFact', GeoFunFactSchema);

export default GeoFunFact;
