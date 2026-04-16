import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWorldCountry extends Document {
  cca2: string;
  nameCommon: string;
  nameOfficial: string;
  capital: string;
  capitalLat: number;
  capitalLng: number;
  flag: string;
  flagPng: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  centerLat: number;
  centerLng: number;
  languages: string;   // JSON string để tránh vấn đề với Map type
  currencies: string;  // JSON string
  unMember: boolean;
  independent: boolean;
}

const WorldCountrySchema: Schema<IWorldCountry> = new mongoose.Schema(
  {
    cca2:         { type: String, required: true, unique: true, index: true },
    nameCommon:   { type: String, default: '' },
    nameOfficial: { type: String, default: '' },
    capital:      { type: String, default: '' },
    capitalLat:   { type: Number, default: 0 },
    capitalLng:   { type: Number, default: 0 },
    flag:         { type: String, default: '' },
    flagPng:      { type: String, default: '' },
    region:       { type: String, default: '' },
    subregion:    { type: String, default: '' },
    population:   { type: Number, default: 0 },
    area:         { type: Number, default: 0 },
    centerLat:    { type: Number, default: 0 },
    centerLng:    { type: Number, default: 0 },
    languages:    { type: String, default: '{}' },
    currencies:   { type: String, default: '{}' },
    unMember:     { type: Boolean, default: false },
    independent:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

const WorldCountry: Model<IWorldCountry> =
  mongoose.models.WorldCountry ??
  mongoose.model<IWorldCountry>('WorldCountry', WorldCountrySchema);

export default WorldCountry;
