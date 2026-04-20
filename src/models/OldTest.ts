import mongoose from 'mongoose';

const oldTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, default: 'Địa lí' },
  grade: { type: Number },
  description: { type: String },
  authorId: { type: String, required: true },
  authorName: { type: String },
  questions: [{
    type: { type: String, enum: ['text', 'quiz'], default: 'quiz' },
    description: { type: String },
    quizQuestion: { type: String },
    quizOptions: [{ type: String }],
    quizCorrectIndex: { type: Number },
  }],
}, { timestamps: true });

export const OldTest = mongoose.models.OldTest || mongoose.model('OldTest', oldTestSchema);
