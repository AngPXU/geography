import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IParticipant {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  seatRow: number; // -1 = no seat yet
  seatCol: number;
  lastSeen: Date;
}

export interface IScore {
  studentId: string;
  studentName: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
}

export interface IQuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  image?: string;
}

export interface IQuizAnswer {
  studentId: string;
  studentName: string;
  answer: 'A' | 'B' | 'C' | 'D';
  answeredAt: Date;
}

export interface IActiveQuiz {
  questions: IQuizQuestion[];
  currentIndex: number;
  currentQuestionStartedAt: Date;
  isPaused: boolean;
  pausedTimeRemaining: number;
  currentAnswers: IQuizAnswer[];
  isFinished: boolean;
  questionDuration: number;
}

export interface IClassroom extends Document {
  name: string;
  code: string; // 6-char unique join code
  passwordHash?: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  subject?: string;
  description?: string;
  rows: number;
  cols: number;
  participants: IParticipant[];
  announcement?: string;
  isActive: boolean;
  scores: IScore[];
  totalQuestionsAsked: number;
  kickedIds: string[];
  activeQuiz?: IActiveQuiz;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    studentId:     { type: String, required: true },
    studentName:   { type: String, required: true },
    studentAvatar: { type: String },
    seatRow:       { type: Number, default: -1 },
    seatCol:       { type: Number, default: -1 },
    lastSeen:      { type: Date, default: Date.now },
  },
  { _id: false },
);

const ScoreSchema = new Schema<IScore>(
  {
    studentId:    { type: String, required: true },
    studentName:  { type: String, required: true },
    totalScore:   { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount:   { type: Number, default: 0 },
  },
  { _id: false },
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correct: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    image:   { type: String },
  },
  { _id: false },
);

const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    studentId:   { type: String, required: true },
    studentName: { type: String, required: true },
    answer:      { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    answeredAt:  { type: Date, default: Date.now },
  },
  { _id: false },
);

const ActiveQuizSchema = new Schema<IActiveQuiz>(
  {
    questions:                { type: [QuizQuestionSchema], required: true },
    currentIndex:             { type: Number, default: 0 },
    currentQuestionStartedAt: { type: Date, default: Date.now },
    isPaused:                 { type: Boolean, default: false },
    pausedTimeRemaining:      { type: Number, default: 10 },
    currentAnswers:           { type: [QuizAnswerSchema], default: [] },
    isFinished:               { type: Boolean, default: false },
    questionDuration:         { type: Number, default: 10 },
  },
  { _id: false },
);

const ClassroomSchema = new Schema<IClassroom>(
  {
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
    passwordHash:  { type: String },
    teacherId:     { type: String, required: true },
    teacherName:   { type: String, required: true },
    teacherAvatar: { type: String },
    subject:       { type: String, trim: true },
    description:   { type: String, trim: true },
    rows:          { type: Number, default: 5, min: 2, max: 8 },
    cols:          { type: Number, default: 6, min: 2, max: 8 },
    participants:  { type: [ParticipantSchema], default: [] },
    announcement:  { type: String },
    isActive:      { type: Boolean, default: true },
    scores:               { type: [ScoreSchema], default: [] },
    totalQuestionsAsked:  { type: Number, default: 0 },
    kickedIds:            { type: [String], default: [] },
    activeQuiz:           { type: ActiveQuizSchema, default: null },
  },
  { timestamps: true },
);

const Classroom: Model<IClassroom> =
  mongoose.models.Classroom || mongoose.model<IClassroom>('Classroom', ClassroomSchema);

export default Classroom;
