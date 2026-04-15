import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICountry extends Document {
  name: string;
  capital: string;
  population: string;
  description: string;
  color: string;
  lat: number;
  lng: number;
  images: string[];
  flag?: string;
  area?: string;
  language?: string;
  currency?: string;
  continent?: string;
  funFact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CountrySchema: Schema<ICountry> = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    capital:     { type: String, required: true },
    population:  { type: String, required: true },
    description: { type: String, required: true },
    color:       { type: String, default: '#06B6D4' },
    lat:         { type: Number, required: true },
    lng:         { type: Number, required: true },
    images:      [{ type: String }],
    flag:        { type: String },
    area:        { type: String },
    language:    { type: String },
    currency:    { type: String },
    continent:   { type: String },
    funFact:     { type: String },
  },
  { timestamps: true }
);

const Country: Model<ICountry> =
  mongoose.models.Country ?? mongoose.model<ICountry>('Country', CountrySchema);

export default Country;
