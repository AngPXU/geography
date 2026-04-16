import mongoose, { Schema, Document } from 'mongoose';

export interface IGeoFeature extends Document {
  id: string;             // Định danh duy nhất (VD: "everest", "gulf-stream")
  category: string;       // Nhóm bản đồ: 'physical' | 'climate' | 'ocean' | 'economic' | 'vietnam'
  subCategory: string;    // Loại cụ thể: 'mountain', 'river', 'current', 'resource', 'city'...
  name: string;           // Tên hiển thị
  lat: number;            // Vĩ độ
  lng: number;            // Kinh độ
  type?: string;          // Phân loại phụ (warm/cold cho hải lưu, oil/coal cho kinh tế)
  path?: [number, number][]; // Đường dẫn tọa độ (dành cho các đường cong như dòng hải lưu, con sông)
  attributes: Record<string, any>; // Lưu trữ linh hoạt: desc, emoji, color, elevation, length, depth, pop...
}

const geoFeatureSchema = new Schema<IGeoFeature>({
  id:          { type: String, required: true, unique: true },
  category:    { type: String, required: true, index: true }, // Index để truy vấn nhanh theo tab Bản đồ
  subCategory: { type: String, required: true },
  name:        { type: String, required: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  type:        { type: String },
  path:        { type: Schema.Types.Mixed, default: undefined }, // Lưu tọa độ linh hoạt (chuỗi line, đứt khúc, multi line)
  attributes:  { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true, // Tự động ghi nhận thời gian seed
  collection: 'geofeatures' // Tên bảng trong DB
});

// Tránh lỗi overwrite model trong môi trường dev của Next.js
// Xóa cache model cũ để reload schema trong môi trường Next.js Dev
if (mongoose.models.GeoFeature) {
  delete mongoose.models.GeoFeature;
}
export const GeoFeature = mongoose.model<IGeoFeature>('GeoFeature', geoFeatureSchema);
