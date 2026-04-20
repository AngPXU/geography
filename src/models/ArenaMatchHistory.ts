import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IArenaMatchHistory extends Document {
  username: string;       // User who played
  gameMode: string;       // e.g., 'map-guessing'
  topic: string;          // e.g., 'all', 'country_pop', 'mountain'
  score: number;          // Final score (max 10000)
  expEarned: number;      // 50 if >= 50%
  playedAt: Date;         // Timestamp of match
}

const ArenaMatchHistorySchema: Schema<IArenaMatchHistory> = new mongoose.Schema(
  {
    username:  { type: String, required: true, index: true },
    gameMode:  { type: String, required: true, default: 'map-guessing' },
    topic:     { type: String, required: true },
    score:     { type: Number, required: true },
    expEarned: { type: Number, required: true, default: 0 },
    playedAt:  { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

const ArenaMatchHistory: Model<IArenaMatchHistory> =
  mongoose.models.ArenaMatchHistory ||
  mongoose.model<IArenaMatchHistory>('ArenaMatchHistory', ArenaMatchHistorySchema);

export default ArenaMatchHistory;
