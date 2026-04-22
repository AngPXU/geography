export type BadgeCategory = 'exp' | 'streak' | 'books' | 'arena' | 'other';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  conditionValue: number;
}

export const BADGES: Badge[] = [
  // ── KINH NGHIỆM (EXP) ──
  { id: 'exp_1', name: 'Lính Mới', description: 'Đạt 100 EXP', icon: '🎒', color: 'from-blue-400 to-cyan-400', category: 'exp', conditionValue: 100 },
  { id: 'exp_2', name: 'Chân Đi', description: 'Đạt 500 EXP', icon: '🚶', color: 'from-emerald-400 to-green-500', category: 'exp', conditionValue: 500 },
  { id: 'exp_3', name: 'Người Dẫn Đường', description: 'Đạt 1.000 EXP', icon: '🧭', color: 'from-amber-400 to-orange-500', category: 'exp', conditionValue: 1000 },
  { id: 'exp_4', name: 'Chuyên Gia Bản Đồ', description: 'Đạt 5.000 EXP', icon: '🗺️', color: 'from-rose-400 to-red-500', category: 'exp', conditionValue: 5000 },
  { id: 'exp_5', name: 'Bậc Thầy Trái Đất', description: 'Đạt 10.000 EXP', icon: '🌍', color: 'from-violet-500 to-purple-600', category: 'exp', conditionValue: 10000 },

  // ── CHUỖI NGÀY HỌC (STREAK) ──
  { id: 'streak_1', name: 'Khởi Động', description: 'Học liên tục 3 ngày', icon: '🔥', color: 'from-orange-400 to-red-400', category: 'streak', conditionValue: 3 },
  { id: 'streak_2', name: 'Chăm Chỉ', description: 'Học liên tục 7 ngày', icon: '📅', color: 'from-cyan-400 to-blue-500', category: 'streak', conditionValue: 7 },
  { id: 'streak_3', name: 'Bền Bỉ', description: 'Học liên tục 14 ngày', icon: '💪', color: 'from-green-400 to-emerald-500', category: 'streak', conditionValue: 14 },
  { id: 'streak_4', name: 'Kỷ Luật Thép', description: 'Học liên tục 30 ngày', icon: '🛡️', color: 'from-slate-400 to-gray-600', category: 'streak', conditionValue: 30 },
  { id: 'streak_5', name: 'Huyền Thoại', description: 'Học liên tục 100 ngày', icon: '👑', color: 'from-yellow-400 to-amber-500', category: 'streak', conditionValue: 100 },

  // ── ĐỌC SÁCH (BOOKS) ──
  { id: 'books_1', name: 'Trang Sách Đầu Tiên', description: 'Đọc 1 cuốn sách', icon: '📖', color: 'from-sky-400 to-indigo-500', category: 'books', conditionValue: 1 },
  { id: 'books_2', name: 'Người Yêu Đọc', description: 'Đọc 5 cuốn sách', icon: '📚', color: 'from-purple-400 to-fuchsia-500', category: 'books', conditionValue: 5 },
  { id: 'books_3', name: 'Bách Khoa Toàn Thư', description: 'Đọc 20 cuốn sách', icon: '🧠', color: 'from-pink-400 to-rose-500', category: 'books', conditionValue: 20 },
  { id: 'books_4', name: 'Bạn Của AI', description: 'Chat với AI 10 lần', icon: '🤖', color: 'from-cyan-400 to-teal-500', category: 'books', conditionValue: 10 },
  { id: 'books_5', name: 'Tiến Sĩ Bác Học', description: 'Đọc 50 cuốn sách', icon: '🎓', color: 'from-red-500 to-orange-500', category: 'books', conditionValue: 50 },

  // ── ĐẤU TRƯỜNG (ARENA) ──
  { id: 'arena_1', name: 'Lần Đầu Ra Trận', description: 'Chơi 1 ván Đấu trường', icon: '⚔️', color: 'from-slate-500 to-slate-700', category: 'arena', conditionValue: 1 },
  { id: 'arena_2', name: 'Tay Súng Bắn Tỉa', description: 'Đoán đúng 5 bản đồ', icon: '🎯', color: 'from-green-500 to-emerald-600', category: 'arena', conditionValue: 5 },
  { id: 'arena_3', name: 'La Bàn Vàng', description: 'Đoán đúng 20 bản đồ', icon: '🧭', color: 'from-yellow-400 to-yellow-600', category: 'arena', conditionValue: 20 },
  { id: 'arena_4', name: 'Bất Bại', description: 'Top 1 Đấu trường', icon: '🏆', color: 'from-amber-400 to-orange-500', category: 'arena', conditionValue: 1 },
  { id: 'arena_5', name: 'Chiến Thần', description: 'Thắng 10 ván Đấu trường', icon: '🐉', color: 'from-red-500 to-rose-600', category: 'arena', conditionValue: 10 },

  // ── KHÁC (OTHER) ──
  { id: 'other_1', name: 'Cú Mèo', description: 'Học sau 22h đêm', icon: '🦉', color: 'from-indigo-600 to-blue-800', category: 'other', conditionValue: 1 },
  { id: 'other_2', name: 'Lớp Trưởng', description: 'Tham gia lớp học', icon: '👨‍🏫', color: 'from-teal-400 to-emerald-500', category: 'other', conditionValue: 1 },
  { id: 'other_3', name: 'Diện Mạo Mới', description: 'Đổi ảnh đại diện', icon: '📸', color: 'from-fuchsia-400 to-purple-500', category: 'other', conditionValue: 1 },
  { id: 'other_4', name: 'Nhà Sưu Tầm', description: 'Mở khoá 10 huy hiệu', icon: '💎', color: 'from-cyan-300 to-blue-400', category: 'other', conditionValue: 10 },
  { id: 'other_5', name: 'Siêu Nhân Địa Lý', description: 'Hoàn thành 50 nhiệm vụ', icon: '🦸', color: 'from-rose-400 to-pink-500', category: 'other', conditionValue: 50 },
];

/**
 * Hàm kiểm tra điều kiện mở khoá huy hiệu.
 * Dùng chung cho BadgesPanel, BadgeUnlockWatcher và ProfileClient.
 * Các điều kiện "other" (Cú mèo, Lớp Trưởng, Diện Mạo Mới, Nhà Sưu Tầm)
 * chưa có dữ liệu backend nên tạm mặc định false.
 */
export function checkUnlocked(
  badge: Badge,
  exp: number,
  streak: number,
  booksRead = 0,
  mapsGuessed = 0,
  arenaWins = 0,
  tasksCompleted = 0,
): boolean {
  switch (badge.category) {
    case 'exp':    return exp >= badge.conditionValue;
    case 'streak': return streak >= badge.conditionValue;
    case 'books':  return booksRead >= badge.conditionValue;
    case 'arena':
      if (badge.id === 'arena_4' || badge.id === 'arena_5') return arenaWins >= badge.conditionValue;
      return mapsGuessed >= badge.conditionValue;
    case 'other':
      if (badge.id === 'other_5') return tasksCompleted >= badge.conditionValue;
      // other_1 (Cú Mèo), other_2 (Lớp Trưởng), other_3 (Diện Mạo Mới),
      // other_4 (Nhà Sưu Tầm) — cần dữ liệu backend → tạm false
      return false;
    default:       return false;
  }
}
