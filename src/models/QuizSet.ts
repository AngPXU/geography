import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizSet extends Document {
  grade: number;
  quizId: string;
  title: string;
  icon: string;
  quizType: string;
  timeLimit: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSetSchema: Schema<IQuizSet> = new mongoose.Schema(
  {
    grade:       { type: Number, required: true, enum: [6, 7, 8, 9] },
    quizId:      { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    icon:        { type: String, default: '📝', trim: true },
    quizType:    { type: String, default: 'kt15p', trim: true },
    timeLimit:   { type: Number, default: 15 },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuizSetSchema.index({ grade: 1, quizId: 1 }, { unique: true });

// Force re-register in dev to pick up schema changes
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).QuizSet;
}
const QuizSet = mongoose.model<IQuizSet>('QuizSet', QuizSetSchema);
export default QuizSet;
