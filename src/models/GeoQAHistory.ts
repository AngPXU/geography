import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeoQAHistory extends Document {
  username: string;
  question: string;
  answer: string;
  funFact?: string;
  relatedTopics?: string[];
  askedAt: Date;
}

const GeoQAHistorySchema: Schema<IGeoQAHistory> = new mongoose.Schema(
  {
    username:      { type: String, required: true, index: true },
    question:      { type: String, required: true },
    answer:        { type: String, required: true },
    funFact:       { type: String },
    relatedTopics: [{ type: String }],
    askedAt:       { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const GeoQAHistory: Model<IGeoQAHistory> =
  mongoose.models.GeoQAHistory ||
  mongoose.model<IGeoQAHistory>('GeoQAHistory', GeoQAHistorySchema);

export default GeoQAHistory;
