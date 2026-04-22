import type { MissionId } from "@/models/DailyMission";

export interface MissionDef {
  id: MissionId;
  label: string;
  sub: string;
  icon: string;
  exp: number;
  coins: number;
  target: number;
  unit: string; // 'phút' | 'địa danh' | 'trò chơi' | 'lớp' | 'trang' | 'lần'
}

export const ALL_MISSIONS: MissionDef[] = [
  {
    id: "online-20",
    label: "Chiến thần online",
    sub: "Online trên trang web 20 phút",
    icon: "⏱️",
    exp: 60,
    coins: 10,
    target: 20,
    unit: "phút",
  },
  {
    id: "explore-map",
    label: "Nhà thám hiểm",
    sub: "Khám phá 1 địa danh trên bản đồ",
    icon: "🗺️",
    exp: 80,
    coins: 15,
    target: 1,
    unit: "địa danh",
  },
  {
    id: "play-arena",
    label: "Đấu trường vinh quang",
    sub: "Chơi 1 trò chơi trong Đấu trường",
    icon: "⚔️",
    exp: 100,
    coins: 20,
    target: 1,
    unit: "trò chơi",
  },
  {
    id: "join-classroom",
    label: "Học trò chăm chỉ",
    sub: "Tham gia 1 lớp học",
    icon: "🏫",
    exp: 90,
    coins: 15,
    target: 1,
    unit: "lớp",
  },
  {
    id: "read-book",
    label: "Học giả địa lý",
    sub: "Đọc ít nhất 1 trang sách",
    icon: "📖",
    exp: 70,
    coins: 10,
    target: 1,
    unit: "trang",
  },
  {
    id: "feed-pet",
    label: "Người Nuôi Thú",
    sub: "Cho thú cưng ăn 1 lần",
    icon: "🍖",
    exp: 50,
    coins: 10,
    target: 1,
    unit: "lần",
  },
];

/** Return Vietnam date string YYYY-MM-DD */
export function getVietnamDateStr(date = new Date()): string {
  // UTC+7
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 10);
}

/**
 * Deterministically pick 3 mission IDs for a given userId + date.
 * Simple Fisher-Yates shuffle seeded by userId+date hash.
 */
export function pickDailyMissions(userId: string, date: string): MissionDef[] {
  const seed = cyrb53(userId + date);
  const arr = [...ALL_MISSIONS];
  // Seeded shuffle
  let rng = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    rng = cyrb53(String(rng));
    const j = Number(rng % BigInt(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

/** Fast non-crypto hash → BigInt */
function cyrb53(str: string): bigint {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return BigInt((4294967296 * (2097151 & h2) + (h1 >>> 0)));
}
