import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GeoFeature } from '@/models/GeoFeature';
import path from 'path';
import fs from 'fs/promises';

// ── Hàm hỗ trợ kết nối DB ──────────────────────────────────────────────────────
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu biến môi trường MONGODB_URI');
  await mongoose.connect(uri);
}

// ── GET: Truy xuất dữ liệu theo từng Chế độ bản đồ ───────────────────────────
export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    // Nếu gọi báo cáo trạng thái seed
    if (category === 'status') {
      const count = await GeoFeature.countDocuments();
      return NextResponse.json({ seeded: count > 0, count });
    }

    if (!category) {
      return NextResponse.json({ error: 'Missing category parameter' }, { status: 400 });
    }

    // Load dữ liệu siêu tốc bằng lean()
    const features = await GeoFeature.find({ category }).lean();
    return NextResponse.json(features);

  } catch (error) {
    console.error('API /map/features Lỗi GET:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}

// ── POST: Mô phỏng gọi API ngoài và lưu vào DB (Bộ Dữ liệu Giáo dục) ────────
export async function POST() {
  await connectDB();
  
  const errors: string[] = [];
  let totalInserted = 0;

  try {
    // Xóa dữ liệu cũ trước khi nạp bộ mới
    await GeoFeature.deleteMany({});
    
    // Đọc JSON đóng vai trò là "API Nguồn Giáo dục"
    const filePath = path.join(process.cwd(), 'src', 'data', 'mapData.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const sourceData = JSON.parse(fileContent);

    const docsToInsert: any[] = [];

    // Helper function phân tích và chuẩn hóa
    const processData = (sourceArray: any[], category: string, subCategory: string, mappingRules: any) => {
      try {
        if (!sourceArray) return;
        sourceArray.forEach(item => {
          const { id, name, lat, lng, type, path, ...rest } = item;
          if (lat == null || lng == null) return; // bỏ qua nếu thiếu tọa độ
          // Loại bỏ các trường không cần lưu vào attributes
          const attributes = { ...rest };
          
          docsToInsert.push({
            id, category, subCategory, name, lat, lng,
            ...(type && { type }),
            ...(path && { path }),
            attributes
          });
        });
      } catch (err: any) {
        errors.push(`Lỗi nạp dữ liệu [${category}/${subCategory}]: ${err.message}`);
      }
    };

    // ── Nạp dữ liệu Natural Earth (Địa hình: Sông, Núi) từ Nguồn Mở ──
    try {
      // 1. Núi non
      const mtRes = await fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/physical/ne_50m_geography_regions_elevation_points.json');
      if (!mtRes.ok) throw new Error('Không lấy được data Núi');
      const mtData = await mtRes.json();
      
      const mountains = mtData.features
        .filter((f: any) => (f.properties.featurecla === 'mountain' || f.properties.featurecla === 'peak') && f.properties.name && f.properties.elevation >= 2500)
        .sort((a: any, b: any) => (a.properties.scalerank || 99) - (b.properties.scalerank || 99))
        .map((f: any) => ({
          id: `ne-mt-${f.properties.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2,5)}`,
          category: 'physical',
          subCategory: 'mountain',
          name: f.properties.name,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          attributes: {
            elevation: f.properties.elevation,
            desc: f.properties.comment || `Đỉnh cao thuộc khu vực ${f.properties.region}`,
            emoji: '🏔️',
            continent: f.properties.region,
            subregion: f.properties.subregion,
            comment: f.properties.comment,
            rank: f.properties.scalerank
          }
        }));
      docsToInsert.push(...mountains);

      // 2. Sông ngòi
      const rvRes = await fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/50m/physical/ne_50m_rivers_lake_centerlines.json');
      if (!rvRes.ok) throw new Error('Không lấy được data Sông');
      const rvData = await rvRes.json();

      const rivers = rvData.features
        .filter((f: any) => f.properties.name)
        .sort((a: any, b: any) => (a.properties.scalerank || 99) - (b.properties.scalerank || 99))
        .slice(0, 200) // Lọc lấy 200 con sông lớn nhất
        .map((f: any) => {
          const reverseCoords = (coords: any): any => {
            if (typeof coords[0] === 'number') return [coords[1], coords[0]];
            return coords.map((c: any) => reverseCoords(c));
          };
          
          let centerLat = 0, centerLng = 0;
          try {
             centerLat = f.geometry.type === 'LineString' ? f.geometry.coordinates[0][1] : f.geometry.coordinates[0][0][1];
             centerLng = f.geometry.type === 'LineString' ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0][0][0];
          } catch(e) {}

          return {
            id: `ne-rv-${f.properties.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2,5)}`,
            category: 'physical',
            subCategory: 'river',
            name: f.properties.name,
            lat: centerLat,
            lng: centerLng,
            path: reverseCoords(f.geometry.coordinates),
            attributes: {
              desc: `Dòng chảy lớn xếp hạng quy mô cấp ${f.properties.scalerank}.`,
              featureClass: f.properties.featurecla,
              nameEn: f.properties.name_en,
              rank: f.properties.scalerank,
              emoji: '💧'
            }
          };
        });
      docsToInsert.push(...rivers);

      // 3. Đại dương & Biển (Marine Polys)
      const ocRes = await fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_geography_marine_polys.json');
      if (!ocRes.ok) throw new Error('Không lấy được data Đại dương');
      const ocData = await ocRes.json();

      const oceans = ocData.features
        .filter((f: any) => f.properties.name)
        .map((f: any) => {
          const reverseCoords = (coords: any): any => {
            if (typeof coords[0] === 'number') return [coords[1], coords[0]];
            return coords.map((c: any) => reverseCoords(c));
          };
          
          let centerLat = 0, centerLng = 0;
          try {
             const flatCoords = f.geometry.coordinates.flat(Infinity);
             centerLng = Number(flatCoords[0]) || 0;
             centerLat = Number(flatCoords[1]) || 0;
          } catch(e) {}

          return {
            id: `ne-oc-${f.properties.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2,5)}`,
            category: 'ocean',
            subCategory: 'marine_poly',
            name: f.properties.name,
            lat: centerLat,
            lng: centerLng,
            path: reverseCoords(f.geometry.coordinates),
            attributes: {
              desc: `Phân vùng Đại dương/Hải vực mở.`,
              featureClass: f.properties.featurecla,
              nameEn: f.properties.name_en,
              rank: f.properties.scalerank,
              emoji: '🌊'
            }
          };
        });
      docsToInsert.push(...oceans);

    } catch (err: any) {
      errors.push(`Lỗi Natural Earth: ${err.message}`);
    }

    // ── Nạp dữ liệu Kinh tế từ World Bank API ───────────────────────────────
    try {
      // Hàm helper đọc indicator World Bank
      const fetchWBIndicator = async (indicator: string): Promise<Record<string, number | null>> => {
        const res = await fetch(
          `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=300&mrv=1`
        );
        if (!res.ok) throw new Error(`WB indicator ${indicator} thất bại`);
        const data = await res.json();
        const map: Record<string, number | null> = {};
        (data[1] as any[]).forEach(d => { map[d.countryiso3code] = d.value ?? null; });
        return map;
      };

      // Song song tải 5 chỉ số kinh tế quan trọng nhất
      const [gdpPerCapita, gdpTotal, population, unemployment, lifeExpectancy] = await Promise.all([
        fetchWBIndicator('NY.GDP.PCAP.CD'),   // GDP/đầu người (USD)
        fetchWBIndicator('NY.GDP.MKTP.CD'),   // Tổng GDP quốc gia
        fetchWBIndicator('SP.POP.TOTL'),      // Dân số
        fetchWBIndicator('SL.UEM.TOTL.ZS'),   // Tỷ lệ thất nghiệp (%)
        fetchWBIndicator('SP.DYN.LE00.IN'),   // Tuổi thọ trung bình
      ]);

      // Lấy danh sách quốc gia với income level và tọa độ
      const countriesRes = await fetch('https://api.worldbank.org/v2/country?format=json&per_page=300');
      if (!countriesRes.ok) throw new Error('Không lấy được danh sách quốc gia từ WB');
      const countriesData = await countriesRes.json();

      // income level → label tiếng Việt
      const INCOME_MAP: Record<string, { label: string; color: string }> = {
        'HIC':  { label: 'Quốc gia Phát triển cao',    color: '#16a34a' },
        'UMC':  { label: 'Quốc gia Thu nhập trên TB',  color: '#0284c7' },
        'LMC':  { label: 'Quốc gia Đang phát triển',   color: '#d97706' },
        'LIC':  { label: 'Quốc gia Kém phát triển',    color: '#dc2626' },
        'INX':  { label: 'Không phân loại',            color: '#94a3b8' },
      };

      const economicDocs = (countriesData[1] as any[])
        .filter((c: any) =>
          c.latitude && c.longitude &&
          c.region?.id && c.region?.id !== 'NA' // chỉ lấy quốc gia thực sự
        )
        .map((c: any) => {
          const iso3 = c.id;
          const incomeLv = c.incomeLevel?.id || 'INX';
          const gdpPC = gdpPerCapita[iso3];
          const gdpTot = gdpTotal[iso3];
          const pop = population[iso3];
          const unem = unemployment[iso3];
          const lifeExp = lifeExpectancy[iso3];
          const { label, color } = INCOME_MAP[incomeLv] || INCOME_MAP['INX'];

          return {
            id: `wb-eco-${iso3.toLowerCase()}`,
            category: 'economic',
            subCategory: 'country_economy',
            name: c.name,
            lat: parseFloat(c.latitude),
            lng: parseFloat(c.longitude),
            attributes: {
              iso3,
              iso2: c.iso2Code,
              region: c.region?.value,
              capitalCity: c.capitalCity,
              incomeLevel: label,
              incomeLevelCode: incomeLv,
              color,
              gdpPerCapita: gdpPC ? Math.round(gdpPC) : null,
              gdpTotal: gdpTot ? Math.round(gdpTot / 1e9) : null, // tỷ USD
              population: pop ? Math.round(pop) : null,
              unemployment: unem ? parseFloat(unem.toFixed(1)) : null,
              lifeExpectancy: lifeExp ? parseFloat(lifeExp.toFixed(1)) : null,
              emoji: incomeLv === 'HIC' ? '🟢' : incomeLv === 'UMC' ? '🔵' : incomeLv === 'LMC' ? '🟡' : '🔴',
              desc: `${label} | Khu vực: ${c.region?.value || '—'}`,
            },
          };
        });

      docsToInsert.push(...economicDocs);
      console.log(`✅ World Bank: Đã nạp ${economicDocs.length} quốc gia với dữ liệu kinh tế đầy đủ`);

    } catch (err: any) {
      errors.push(`Lỗi World Bank API: ${err.message}`);
    }

    // Chuẩn hóa và xếp hàng dữ liệu Giáo dục khác từ mapData.json
    processData(sourceData.mountains, 'physical', 'mountain', {});
    processData(sourceData.rivers,    'physical', 'river', {});
    processData(sourceData.climatePoints, 'climate', 'climatePoint', {});
    processData(sourceData.oceans,    'ocean', 'ocean', {});
    processData(sourceData.currents,  'ocean', 'current', {});
    processData(sourceData.oceanFeatures, 'ocean', 'trench', {});
    processData(sourceData.vnRegions, 'vietnam', 'vnRegion', {});
    processData(sourceData.vnCities,  'vietnam', 'vnCity', {});

    // Nếu không có lỗi trong quá trình chuẩn hóa, ghi vào Database
    if (docsToInsert.length > 0) {
      await GeoFeature.insertMany(docsToInsert);
      totalInserted = docsToInsert.length;
    } else {
      errors.push('Không tìm thấy dữ liệu hợp lệ trong nguồn phát.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hoàn tất với một số lỗi', 
        errors,
        inserted: totalInserted 
      }, { status: 400 }); // Trả về 400 để Frontend dễ catch
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Đã cập nhật toàn bộ Hệ thống Dữ liệu Giáo dục thành công!', 
      inserted: totalInserted 
    });

  } catch (error: any) {
    console.error('API /map/features Lỗi POST (Seed):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Lỗi máy chủ nghiêm trọng khi ghi Database', 
      details: error.message 
    }, { status: 500 });
  }
}
