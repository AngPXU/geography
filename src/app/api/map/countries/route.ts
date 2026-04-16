import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import WorldCountry from '@/models/WorldCountry';

// Dùng raw JSON từ GitHub CDN (nguồn gốc của restcountries.com)
// Không rate limit, không bị block server-side, cùng định dạng dữ liệu
const REST_COUNTRIES_URL =
  'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';

// GET — trả về danh sách quốc gia từ DB (cho Political map)
export async function GET() {
  try {
    await dbConnect();
    const count = await WorldCountry.countDocuments();

    if (count === 0) {
      return NextResponse.json({ seeded: false, countries: [], count: 0 });
    }

    const countries = await WorldCountry.find(
      {},
      {
        cca2: 1, nameCommon: 1, nameOfficial: 1,
        capital: 1, capitalLat: 1, capitalLng: 1,
        flag: 1, region: 1, subregion: 1,
        population: 1, area: 1,
        centerLat: 1, centerLng: 1,
        languages: 1, currencies: 1,  // cần cho info panel
      }
    ).lean();


    return NextResponse.json({ seeded: true, count, countries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — seed dữ liệu từ REST Countries API vào MongoDB
export async function POST() {
  try {
    await dbConnect();

    // Fetch với timeout 30 giây
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let raw: any[];
    try {
      const res = await fetch(REST_COUNTRIES_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'GeoExplore-App/1.0' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json(
          { error: `REST Countries API lỗi: HTTP ${res.status}` },
          { status: 502 }
        );
      }
      raw = await res.json();
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({ error: 'REST Countries API timeout (>30s)' }, { status: 504 });
      }
      return NextResponse.json(
        { error: `Không thể kết nối: ${fetchErr.message}` },
        { status: 502 }
      );
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: 'API trả về dữ liệu rỗng' }, { status: 502 });
    }

    // Chuyển đổi sang schema phẳng — mapping đúng theo cấu trúc mledoze
    // mledoze KHÔNG có capitalInfo.latlng hay flags.png
    // Chỉ có: latlng (trung tâm QG), capital (array tên thủ đô), flag (emoji)
    const ops = raw.map((c: any) => {
      const latlng: number[] = c.latlng ?? [];

      return {
        updateOne: {
          filter:  { cca2: c.cca2 },
          update: {
            $set: {
              cca2:         c.cca2 ?? '',
              nameCommon:   c.name?.common ?? '',
              nameOfficial: c.name?.official ?? '',
              capital:      c.capital?.[0] ?? '',
              // mledoze không có tọa độ thủ đô riêng → dùng trung tâm QG
              capitalLat:   latlng[0] ?? 0,
              capitalLng:   latlng[1] ?? 0,
              flag:         c.flag ?? '',
              flagPng:      '',             // mledoze không có flags.png
              region:       c.region ?? '',
              subregion:    c.subregion ?? '',
              population:   c.population ?? 0,
              area:         c.area ?? 0,
              centerLat:    latlng[0] ?? 0,
              centerLng:    latlng[1] ?? 0,
              languages:    JSON.stringify(c.languages ?? {}),
              currencies:   JSON.stringify(c.currencies ?? {}),
              unMember:     c.unMember ?? false,
              independent:  c.independent ?? false,
            },
          },
          upsert: true,
        },
      };
    });


    // Thực hiện bulkWrite — giới hạn 500 records/batch để tránh timeout
    const BATCH = 100;
    let totalUpserted = 0;
    let totalModified = 0;

    for (let i = 0; i < ops.length; i += BATCH) {
      const batch = ops.slice(i, i + BATCH);
      const result = await WorldCountry.bulkWrite(batch, { ordered: false });
      totalUpserted += result.upsertedCount;
      totalModified += result.modifiedCount;
    }

    return NextResponse.json({
      message: 'Seed thành công',
      total: ops.length,
      upserted: totalUpserted,
      modified: totalModified,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: `Lỗi server: ${err.message}` },
      { status: 500 }
    );
  }
}
