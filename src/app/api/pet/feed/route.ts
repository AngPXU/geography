import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { getPetInfo } from '@/utils/petSystem';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json(); 
    const feedAmount = amount || 1;
    const expPerFeed = 20; // Luôn được 20 EXP mỗi lần

    await dbConnect();

    const user = await User.findOne({ username: session.user.name });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const petExp = user.petExp || 0;
    const { currentLevel, isMaxLevel } = getPetInfo(petExp);

    if (isMaxLevel) {
      return NextResponse.json({ error: 'Thú cưng đã đạt cấp tối đa!' }, { status: 400 });
    }

    const costPerFeed = currentLevel.feedCost;
    const totalCost = costPerFeed * feedAmount;

    if ((user.coins || 0) < totalCost) {
      return NextResponse.json({ error: 'Không đủ xu để cho ăn' }, { status: 400 });
    }

    // Trừ xu và cộng kinh nghiệm
    user.coins -= totalCost;
    user.petExp += (expPerFeed * feedAmount);

    // Kiểm tra Lên cấp (Level Up)
    const newPetInfo = getPetInfo(user.petExp);
    let leveledUp = false;
    let rewardCoins = 0;

    // Nếu level mới lớn hơn level cũ -> Đã lên cấp
    if (newPetInfo.currentLevel.level > currentLevel.level) {
      leveledUp = true;
      // Cộng tổng tất cả phần thưởng xu của các level vừa vượt qua (phòng trường hợp ăn 1 lần vượt nhiều cấp)
      for (let lvl = currentLevel.level + 1; lvl <= newPetInfo.currentLevel.level; lvl++) {
        const lvlData = require('@/utils/petSystem').PET_LEVELS.find((l: any) => l.level === lvl);
        if (lvlData) rewardCoins += lvlData.rewardCoins;
      }
      user.coins += rewardCoins;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      coins: user.coins,
      petExp: user.petExp,
      leveledUp,
      rewardCoins,
      newLevel: newPetInfo.currentLevel.level,
      newStage: newPetInfo.currentLevel.stage
    });
  } catch (error: any) {
    console.error('[Pet Feed API Error]', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra' }, { status: 500 });
  }
}
