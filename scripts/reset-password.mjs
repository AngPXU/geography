/**
 * Script đặt lại mật khẩu cho một user trong MongoDB.
 * Chạy: node scripts/reset-password.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// ---- Mongoose Schema tối giản ----
const UserSchema = new mongoose.Schema({ username: String, email: String, password: String });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ---- Kết nối MongoDB ----
const MONGODB_URI = 'mongodb+srv://GeographyWeb:Z6434IBXcdAE3mxQ54Atb3z@geographyweb.ecdpvid.mongodb.net/?appName=GeographyWeb';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Đã kết nối MongoDB\n');

  const rl = readline.createInterface({ input, output });

  const username = await rl.question('👤 Nhập username cần reset mật khẩu: ');
  const newPassword = await rl.question('🔑 Nhập mật khẩu mới: ');
  rl.close();

  const user = await User.findOne({ username });
  if (!user) {
    console.error(`❌ Không tìm thấy user "${username}" trong database!`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  user.password = hashed;
  await user.save();

  console.log(`\n✅ Đã reset mật khẩu cho "${username}" thành công!`);
  console.log(`   Hash mới: ${hashed}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
