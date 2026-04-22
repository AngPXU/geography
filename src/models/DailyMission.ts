import mongoose, { Document, Schema } from "mongoose";

export type MissionId =
  | "online-20"
  | "explore-map"
  | "play-arena"
  | "join-classroom"
  | "read-book"
  | "feed-pet";

export interface IMissionSlot {
  missionId: MissionId;
  exp: number;
  progress: number;   // current progress (minutes / count)
  target: number;     // target to reach
  completed: boolean;
  claimed: boolean;
}

export interface IDailyMission extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;              // 'YYYY-MM-DD' in Vietnam time (UTC+7)
  missions: IMissionSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const MissionSlotSchema = new Schema<IMissionSlot>(
  {
    missionId: { type: String, required: true },
    exp:       { type: Number, required: true },
    progress:  { type: Number, default: 0 },
    target:    { type: Number, required: true },
    completed: { type: Boolean, default: false },
    claimed:   { type: Boolean, default: false },
  },
  { _id: false }
);

const DailyMissionSchema = new Schema<IDailyMission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date:   { type: String, required: true }, // 'YYYY-MM-DD'
    missions: { type: [MissionSlotSchema], required: true },
  },
  { timestamps: true }
);

DailyMissionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyMission ||
  mongoose.model<IDailyMission>("DailyMission", DailyMissionSchema);
