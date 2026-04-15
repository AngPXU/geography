import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://ip-api.com/json/?fields=status,lat,lon,country,city',
      { next: { revalidate: 300 } }, // cache 5 phút
    );
    const data = (await res.json()) as {
      status: string;
      lat?: number;
      lon?: number;
      country?: string;
      city?: string;
    };
    if (data.status !== 'success' || data.lat === undefined) {
      return NextResponse.json({ error: 'unavailable' }, { status: 200 });
    }
    return NextResponse.json(
      { lat: data.lat, lon: data.lon, country: data.country ?? '', city: data.city ?? '' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 200 });
  }
}
