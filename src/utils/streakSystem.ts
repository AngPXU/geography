export interface StreakMilestone {
  days: number;
  reward: number; // Xu thưởng
  icon: string;
  label: string;
}

/**
 * Các mốc chuỗi ngày học và phần thưởng Xu tương ứng.
 * Bắt đầu từ 100 Xu, tăng thêm 100 Xu cho mỗi mốc tiếp theo.
 */
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3,   reward: 100,  icon: '🌱', label: 'Chồi Xanh' },
  { days: 7,   reward: 200,  icon: '🔥', label: 'Tuần Đầu' },
  { days: 14,  reward: 300,  icon: '⚡', label: 'Hai Tuần' },
  { days: 21,  reward: 400,  icon: '🌟', label: 'Ba Tuần' },
  { days: 30,  reward: 500,  icon: '🏆', label: 'Một Tháng' },
  { days: 50,  reward: 600,  icon: '💎', label: 'Nửa Trăm' },
  { days: 75,  reward: 700,  icon: '🦅', label: 'Đại Bàng' },
  { days: 100, reward: 800,  icon: '🧠', label: 'Một Trăm' },
  { days: 150, reward: 900,  icon: '🌈', label: 'Bậc Thầy' },
  { days: 200, reward: 1000, icon: '👑', label: 'Vua Học' },
  { days: 300, reward: 1200, icon: '🚀', label: 'Huyền Thoại' },
  { days: 365, reward: 1500, icon: '🌍', label: 'Một Năm' },
];

/**
 * Kiểm tra xem streak hiện tại có vừa chạm đúng một mốc thưởng không.
 */
export function getStreakMilestoneReached(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days === streak) ?? null;
}

/**
 * Trả về mốc tiếp theo cần đạt.
 */
export function getNextStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days > streak) ?? null;
}
