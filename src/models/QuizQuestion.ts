import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion extends Document {
  quizSetId: mongoose.Types.ObjectId;
  questionType: 'mc' | 'tf' | 'essay'; // mc = multiple choice, tf = true/false, essay = tự luận
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  // MC & TF share options (4 sub-statements)
  options: string[];
  // MC: index of correct option (0-3)
  correctOption?: number;
  // TF: one boolean per sub-statement
  tfAnswers?: boolean[];
  // Essay: model answer for teacher reference
  essayAnswer?: string;
  explanation?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema: Schema<IQuizQuestion> = new mongoose.Schema(
  {
    quizSetId:    { type: Schema.Types.ObjectId, ref: 'QuizSet', required: true },
    questionType: { type: String, enum: ['mc', 'tf', 'essay'], default: 'mc' },
    content:      { type: String, required: true, trim: true },
    mediaUrl:     { type: String, trim: true },
    mediaType:    { type: String, enum: ['image', 'video', 'audio'] },
    options:      { type: [String], default: [] },
    correctOption:{ type: Number, min: 0, max: 3 },
    tfAnswers:    { type: [Boolean], default: undefined },
    essayAnswer:  { type: String, trim: true },
    explanation:  { type: String, trim: true },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

QuizQuestionSchema.index({ quizSetId: 1, order: 1 });

// Force re-register in dev to pick up schema changes
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).QuizQuestion;
}
const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', QuizQuestionSchema);
export default QuizQuestion;
