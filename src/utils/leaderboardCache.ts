import { unstable_cache } from 'next/cache';
import dbConnect from './db';
import User from '@/models/User';
import { getPetInfo } from './petSystem';

/**
 * Cache top EXP users for 60 seconds.
 */
export const getCachedTopExp = unstable_cache(
  async (limit: number = 50) => {
    await dbConnect();
    const topExpRaw = await User.find({ role: 3 })
      .sort({ exp: -1 })
      .limit(limit)
      .select('username fullName avatar exp')
      .lean();

    return topExpRaw.map(u => ({
      _id: u._id.toString(),
      username: u.username,
      fullName: u.fullName as string | undefined,
      avatar: u.avatar as string | undefined,
      score: (u as any).exp || 0
    }));
  },
  ['leaderboard-top-exp'],
  { revalidate: 60 }
);

/**
 * Cache top Pet users for 60 seconds.
 */
export const getCachedTopPet = unstable_cache(
  async (limit: number = 50) => {
    await dbConnect();
    const topPetRaw = await User.find({ role: 3 })
      .sort({ petExp: -1 })
      .limit(limit)
      .select('username fullName avatar petExp')
      .lean();

    return topPetRaw.map(u => ({
      _id: u._id.toString(),
      username: u.username,
      fullName: u.fullName as string | undefined,
      avatar: u.avatar as string | undefined,
      score: getPetInfo((u as any).petExp || 0).currentLevel.level
    }));
  },
  ['leaderboard-top-pet'],
  { revalidate: 60 }
);
