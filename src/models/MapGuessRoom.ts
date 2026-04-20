import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMapGuessRoom extends Document {
  roomCode: string;
  password?: string;
  host: string;
  guest?: string;
  status: 'WAITING' | 'PLAYING' | 'SUMMARY';
  topic: string;
  questions: any[];       // 10 pre-rolled questions
  currentRound: number;   // 0 to 9
  roundEndsAt?: Date;     // Server timestamp when the 10s round expires
  hostScore: number;
  guestScore: number;
  // Guesses for each round (arrays of length 10)
  hostGuesses: { lat: number; lng: number; dist: number; score: number }[];
  guestGuesses: { lat: number; lng: number; dist: number; score: number }[];
  winner?: string;        // username of the winner, or 'DRAW'
  createdAt: Date;
  updatedAt: Date;
}

const MapGuessRoomSchema: Schema<IMapGuessRoom> = new mongoose.Schema(
  {
    roomCode:     { type: String, required: true, unique: true, index: true },
    password:     { type: String },
    host:         { type: String, required: true },
    guest:        { type: String },
    status:       { type: String, enum: ['WAITING', 'PLAYING', 'SUMMARY'], default: 'WAITING' },
    topic:        { type: String, default: 'all' },
    questions:    { type: [Schema.Types.Mixed as any], default: [] },
    currentRound: { type: Number, default: 0 },
    roundEndsAt:  { type: Date },
    hostScore:    { type: Number, default: 0 },
    guestScore:   { type: Number, default: 0 },
    hostGuesses:  { type: [Schema.Types.Mixed as any], default: [] },
    guestGuesses: { type: [Schema.Types.Mixed as any], default: [] },
    winner:       { type: String },
    createdAt:    { type: Date, default: Date.now, expires: 43200 }, // Auto-delete room after 12h via MongoDB TTL
  },
  { timestamps: true }
);

const MapGuessRoom: Model<IMapGuessRoom> =
  mongoose.models.MapGuessRoom ||
  mongoose.model<IMapGuessRoom>('MapGuessRoom', MapGuessRoomSchema);

export default MapGuessRoom;
