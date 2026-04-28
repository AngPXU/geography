import mongoose from 'mongoose';

const PresentationSchema = new mongoose.Schema({
  title: { type: String, default: 'Bài giảng không tên' },
  author: { type: String, required: true }, // Lưu tên hoặc ID giáo viên
  grade: { type: Number, required: true, default: 6 }, // Khối lớp
  blocks: { type: Array, required: true }, // Mảng JSON chứa cấu trúc các block
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Presentation || mongoose.model('Presentation', PresentationSchema);
