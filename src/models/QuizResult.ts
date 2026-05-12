import mongoose, { Document, Schema } from 'mongoose';

export interface IExitEntry {
  id: number;
  time: string;
  reason: 'tab' | 'app';
}

export interface IQuizResult extends Document {
  setId: mongoose.Types.ObjectId;
  userId: string;
  username: string;
  grade: number;
  quizTitle: string;
  quizType: string;
  mcAnswers: Record<string, number | null>;
  tfAnswers: Record<string, (boolean | null)[]>;
  essayAnswers: Record<string, string>;
  mcCorrect: number;
  mcTotal: number;
  tfCorrect: number;
  tfTotal: number;
  essayAnswered: number;
  essayTotal: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
  exitCount: number;
  exitLog: IExitEntry[];
  submittedAt: Date;
}

const ExitEntrySchema = new Schema<IExitEntry>(
  { id: Number, time: String, reason: { type: String, enum: ['tab', 'app'] } },
  { _id: false }
);

const QuizResultSchema: Schema<IQuizResult> = new mongoose.Schema(
  {
    setId:            { type: Schema.Types.ObjectId, required: true, ref: 'QuizSet', index: true },
    userId:           { type: String, required: true, index: true },
    username:         { type: String, default: '' },
    grade:            { type: Number, default: 6 },
    quizTitle:        { type: String, default: '' },
    quizType:         { type: String, default: '' },
    mcAnswers:        { type: Schema.Types.Mixed, default: {} },
    tfAnswers:        { type: Schema.Types.Mixed, default: {} },
    essayAnswers:     { type: Schema.Types.Mixed, default: {} },
    mcCorrect:        { type: Number, default: 0 },
    mcTotal:          { type: Number, default: 0 },
    tfCorrect:        { type: Number, default: 0 },
    tfTotal:          { type: Number, default: 0 },
    essayAnswered:    { type: Number, default: 0 },
    essayTotal:       { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    timeLimitSeconds: { type: Number, default: 0 },
    exitCount:        { type: Number, default: 0 },
    exitLog:          { type: [ExitEntrySchema], default: [] },
    submittedAt:      { type: Date, default: Date.now },
  },
  { timestamps: false }
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).QuizResult;
}
const QuizResult = mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);
export default QuizResult;
