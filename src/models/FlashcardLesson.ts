import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardLesson extends Document {
  grade: number;
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardLessonSchema: Schema<IFlashcardLesson> = new mongoose.Schema(
  {
    grade:       { type: Number, required: true, enum: [6, 7, 8, 9] },
    lessonId:    { type: String, required: true, trim: true },
    lessonTitle: { type: String, required: true, trim: true },
    lessonIcon:  { type: String, default: '📚', trim: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

FlashcardLessonSchema.index({ grade: 1, lessonId: 1 }, { unique: true });

const FlashcardLesson =
  mongoose.models.FlashcardLesson ||
  mongoose.model<IFlashcardLesson>('FlashcardLesson', FlashcardLessonSchema);

export default FlashcardLesson;
