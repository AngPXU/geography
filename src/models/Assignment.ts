import mongoose, { Document, Model, Schema } from 'mongoose';

// ─── Sub-interfaces ───────────────────────────────────────────────────────────

export interface IQuestion {
  type: 'text' | 'quiz';
  description?: string;        // HTML rich text for text prompts; optional context for quiz
  quizQuestion?: string;       // The quiz question text
  quizOptions?: string[];      // 4 answer choices
  quizCorrectIndex?: number;   // 0-3
}

export interface ISubmissionAnswer {
  questionIdx: number;         // index into questions[]
  answer?: string;             // quiz: "0"/"1"/"2"/"3"; text: raw answer text
  textScore?: number;          // 0-10, teacher-set for text questions
}

export interface ISubmission {
  userId: mongoose.Types.ObjectId;
  username: string;
  submittedAt: Date;
  answers: ISubmissionAnswer[];
  totalScore?: number;         // 0-10, auto-computed when all text questions graded
  fullyGraded?: boolean;       // true when all text questions have textScore
  gradedAt?: Date;
}

export interface IAssignment extends Document {
  homeClassId: mongoose.Types.ObjectId;
  title: string;
  questions: IQuestion[];
  dueDate?: Date;
  expReward: number;
  submissions: ISubmission[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Score computation helper ─────────────────────────────────────────────────

/**
 * Computes total score (0–10, integer ceil) for a submission.
 * - Quiz:  correct = full weight, wrong = 0
 * - Text:  teacher gives 0–10 → normalised to 0–1
 * Formula: rawSum * (10/N), ceil, capped at 10
 */
export function computeAssignmentScore(
  questions: IQuestion[],
  answers:   ISubmissionAnswer[]
): { totalScore: number; fullyGraded: boolean } {
  const N = questions.length;
  if (N === 0) return { totalScore: 0, fullyGraded: true };

  let rawSum       = 0;
  let textUngraded = 0;

  for (let i = 0; i < N; i++) {
    const q   = questions[i];
    const ans = answers.find(a => a.questionIdx === i);

    if (q.type === 'quiz') {
      const correct =
        ans?.answer !== undefined &&
        Number(ans.answer) === q.quizCorrectIndex;
      rawSum += correct ? 1 : 0;
    } else {
      if (ans?.textScore !== undefined) {
        rawSum += ans.textScore / 10;
      } else {
        textUngraded++;
      }
    }
  }

  const fullyGraded = textUngraded === 0;
  const rawTotal    = rawSum * (10 / N);
  const totalScore  = rawTotal === 0 ? 0 : Math.min(10, Math.ceil(rawTotal));

  return { totalScore, fullyGraded };
}

// ─── Mongoose Schema ──────────────────────────────────────────────────────────

const QuestionSchema = new Schema<IQuestion>(
  {
    type:             { type: String, enum: ['text', 'quiz'], required: true },
    description:      { type: String },
    quizQuestion:     { type: String, trim: true },
    quizOptions:      [{ type: String, trim: true }],
    quizCorrectIndex: { type: Number, min: 0, max: 3 },
  },
  { _id: false }
);

const SubmissionAnswerSchema = new Schema<ISubmissionAnswer>(
  {
    questionIdx: { type: Number, required: true },
    answer:      { type: String },
    textScore:   { type: Number, min: 0, max: 10 },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username:    { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    answers:     [SubmissionAnswerSchema],
    totalScore:  { type: Number, min: 0, max: 10 },
    fullyGraded: { type: Boolean, default: false },
    gradedAt:    { type: Date },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    homeClassId: { type: Schema.Types.ObjectId, ref: 'HomeClass', required: true },
    title:       { type: String, required: true, trim: true },
    questions:   [QuestionSchema],
    dueDate:     { type: Date },
    expReward:   { type: Number, default: 20 },
    submissions: [SubmissionSchema],
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ homeClassId: 1, createdAt: -1 });

const Assignment: Model<IAssignment> =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
