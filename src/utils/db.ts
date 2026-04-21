import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable inside .env");
}

// Tái sử dụng connection trong cùng một Lambda instance (warm invocation).
// Mỗi Vercel serverless instance có process riêng nên global cache chỉ giúp
// trong phạm vi 1 instance — đây là cách duy nhất đúng với serverless.
let cached = (global as any).mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const OPTS: mongoose.ConnectOptions = {
  // ── Buffer & commands ──────────────────────────────────────────────────
  bufferCommands: false,           // Không queue lệnh khi chưa connect — fail nhanh thay vì treo

  // ── Connection pool (quan trọng cho serverless) ────────────────────────
  maxPoolSize: 10,                 // Tối đa 10 connections / Lambda instance
  minPoolSize: 0,                  // Cho phép giải phóng hết connection khi nhàn (serverless-friendly)
  maxIdleTimeMS: 10_000,           // Đóng connection đã idle > 10s → tránh tích lũy connection cũ

  // ── Timeouts ──────────────────────────────────────────────────────────
  serverSelectionTimeoutMS: 5_000, // Bỏ cuộc chọn server sau 5s (tránh request treo)
  connectTimeoutMS: 10_000,        // Timeout khi mở TCP connection mới
  socketTimeoutMS: 45_000,         // Timeout cho operation đang chạy (đọc/ghi)
};

async function dbConnect(): Promise<typeof mongoose> {
  // Reuse connection nếu đã có (warm Lambda)
  if (cached.conn) {
    return cached.conn;
  }

  // Chỉ tạo 1 promise dù nhiều request đến cùng lúc (cold start race condition)
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, OPTS);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset để lần sau có thể thử lại
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
