export interface PetLevelData {
  level: number;
  expRequired: number; // Tổng EXP cần để ĐẠT ĐƯỢC level này (Level 1 luôn là 0)
  feedCost: number; // Chi phí xu để cho ăn ở level này
  rewardCoins: number; // Xu thưởng khi đạt level này
  stage: number; // Hình thái (1, 2, 3, 4)
  stageName: string;
}

export const PET_LEVELS: PetLevelData[] = [
  { level: 1, expRequired: 0, feedCost: 20, rewardCoins: 0, stage: 1, stageName: 'Mầm Non' },
  { level: 2, expRequired: 100, feedCost: 30, rewardCoins: 20, stage: 1, stageName: 'Mầm Non' },
  { level: 3, expRequired: 250, feedCost: 40, rewardCoins: 30, stage: 1, stageName: 'Mầm Non' },
  { level: 4, expRequired: 450, feedCost: 50, rewardCoins: 50, stage: 2, stageName: 'Trưởng Thành' }, // Tiến hóa 1
  { level: 5, expRequired: 700, feedCost: 60, rewardCoins: 50, stage: 2, stageName: 'Trưởng Thành' },
  { level: 6, expRequired: 1000, feedCost: 70, rewardCoins: 70, stage: 2, stageName: 'Trưởng Thành' },
  { level: 7, expRequired: 1400, feedCost: 80, rewardCoins: 100, stage: 3, stageName: 'Linh Thú' }, // Tiến hóa 2
  { level: 8, expRequired: 1900, feedCost: 90, rewardCoins: 100, stage: 3, stageName: 'Linh Thú' },
  { level: 9, expRequired: 2500, feedCost: 100, rewardCoins: 150, stage: 3, stageName: 'Linh Thú' },
  { level: 10, expRequired: 3200, feedCost: 120, rewardCoins: 300, stage: 4, stageName: 'Thần Thú' }, // Tiến hóa 3 (Max)
];

/**
 * Trả về thông tin chi tiết của thú cưng dựa trên tổng lượng EXP hiện có
 */
export function getPetInfo(currentExp: number) {
  let currentLevelData = PET_LEVELS[0];
  let nextLevelData: PetLevelData | null = PET_LEVELS[1];

  for (let i = 0; i < PET_LEVELS.length; i++) {
    if (currentExp >= PET_LEVELS[i].expRequired) {
      currentLevelData = PET_LEVELS[i];
      nextLevelData = PET_LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  // Nếu max level
  if (!nextLevelData) {
    return {
      currentLevel: currentLevelData,
      nextLevel: null,
      progressPercent: 100,
      expToNext: 0,
      isMaxLevel: true
    };
  }

  // Tính phần trăm tiến trình của Level hiện tại
  const expInCurrentLevel = currentExp - currentLevelData.expRequired;
  const expNeededForNextLevel = nextLevelData.expRequired - currentLevelData.expRequired;
  const progressPercent = Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100);

  return {
    currentLevel: currentLevelData,
    nextLevel: nextLevelData,
    progressPercent,
    expToNext: expNeededForNextLevel - expInCurrentLevel,
    isMaxLevel: false
  };
}
