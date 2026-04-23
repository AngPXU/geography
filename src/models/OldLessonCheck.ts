import mongoose, { Document, Schema } from 'mongoose';

export interface IOldLessonQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface IOldLessonCheck extends Document {
  teacherId: string;
  classId?: string; // Tùy chọn: Gắn bài kiểm tra với một lớp học cụ thể
  title: string;
  questions: IOldLessonQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const OldLessonQuestionSchema = new Schema<IOldLessonQuestion>({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0, max: 3 }
});

const OldLessonCheckSchema = new Schema<IOldLessonCheck>(
  {
    teacherId: { type: String, required: true, index: true },
    classId: { type: String, index: true }, // Tùy chọn, có thể null
    title: { type: String, required: true, trim: true },
    questions: { type: [OldLessonQuestionSchema], default: [] }
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as any).OldLessonCheck;
}
const OldLessonCheck = mongoose.models.OldLessonCheck || mongoose.model<IOldLessonCheck>('OldLessonCheck', OldLessonCheckSchema);
export default OldLessonCheck;
