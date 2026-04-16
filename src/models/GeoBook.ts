import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeoBook extends Document {
  grade: 6 | 7 | 8 | 9;
  title: string;
  subtitle: string;
  publisher: string;           // Nhà xuất bản (Kết nối tri thức, Chân trời sáng tạo...)
  pdfFilename: string;         // Tên file PDF lưu trong /public/books/
  startPage: number;           // Trang bắt đầu hiển thị mặc định (VD: 96 cho phần Địa Lý)
  totalPages: number;
  coverColor: string;
  uploadedAt: Date;
}

const GeoBookSchema: Schema<IGeoBook> = new mongoose.Schema(
  {
    grade:        { type: Number, enum: [6, 7, 8, 9], required: true },
    title:        { type: String, required: true },
    subtitle:     { type: String, default: '' },
    publisher:    { type: String, default: 'Kết nối tri thức với cuộc sống' },
    pdfFilename:  { type: String, required: true },
    startPage:    { type: Number, default: 1 },
    totalPages:   { type: Number, default: 0 },
    coverColor:   { type: String, default: '#06B6D4' },
    uploadedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const GeoBook: Model<IGeoBook> =
  mongoose.models.GeoBook ||
  mongoose.model<IGeoBook>('GeoBook', GeoBookSchema);

export default GeoBook;
