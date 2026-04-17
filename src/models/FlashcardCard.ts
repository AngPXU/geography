import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardCard extends Document {
  grade: number;
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
  front: string;
  back: string;
  hint?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardCardSchema: Schema<IFlashcardCard> = new mongoose.Schema(
  {
    grade:       { type: Number, required: true, enum: [6, 7, 8, 9] },
    lessonId:    { type: String, required: true, trim: true },
    lessonTitle: { type: String, required: true, trim: true },
    lessonIcon:  { type: String, default: '📚', trim: true },
    front:       { type: String, required: true, trim: true },
    back:        { type: String, required: true, trim: true },
    hint:        { type: String, trim: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

FlashcardCardSchema.index({ grade: 1, lessonId: 1, order: 1 });

const FlashcardCard =
  mongoose.models.FlashcardCard ||
  mongoose.model<IFlashcardCard>('FlashcardCard', FlashcardCardSchema);

export default FlashcardCard;
