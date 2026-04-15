import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import Country from '@/models/Country';
import User from '@/models/User';

const DEFAULT_COUNTRIES = [
  {
    name: 'Việt Nam', capital: 'Hà Nội', population: '100 Triệu',
    description: 'Quốc gia hình chữ S với 3260km bờ biển tuyệt đẹp, nền ẩm thực đường phố nức tiếng thế giới và bề dày lịch sử ngàn năm văn hiến.',
    color: '#ec4899', lat: 21.0285, lng: 105.8542,
    flag: '🇻🇳', area: '331.212 km²', language: 'Tiếng Việt', currency: 'Đồng (VND)',
    continent: 'Châu Á',
    funFact: 'Việt Nam là một trong số ít quốc gia có di sản thiên nhiên thế giới như Vịnh Hạ Long được UNESCO công nhận.',
    images: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    ],
  },
  {
    name: 'Hoa Kỳ', capital: 'Washington, D.C.', population: '335 Triệu',
    description: 'Cường quốc có nền kinh tế lớn nhất thế giới, nổi bật với sự đa dạng văn hóa và các cảnh quan thiên nhiên hùng vĩ trải dài từ bờ Đông sang bờ Tây.',
    color: '#3b82f6', lat: 38.8951, lng: -77.0364,
    flag: '🇺🇸', area: '9.834.000 km²', language: 'Tiếng Anh', currency: 'Đô la (USD)',
    continent: 'Châu Mỹ',
    funFact: 'Hoa Kỳ có tới 63 vườn quốc gia, chiếm khoảng 12% diện tích lãnh thổ.',
    images: [
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
    ],
  },
  {
    name: 'Trung Quốc', capital: 'Bắc Kinh', population: '1.4 Tỷ',
    description: 'Đất nước tỷ dân với nền văn minh rực rỡ lâu đời, sở hữu Vạn Lý Trường Thành kỳ vĩ và sự phát triển công nghệ vượt bậc.',
    color: '#ef4444', lat: 39.9042, lng: 116.4074,
    flag: '🇨🇳', area: '9.597.000 km²', language: 'Tiếng Trung', currency: 'Nhân dân tệ (CNY)',
    continent: 'Châu Á',
    funFact: 'Vạn Lý Trường Thành dài hơn 21.000 km, đủ để nối từ Trái Đất đến Mặt Trăng nếu trải thẳng ra.',
    images: [
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
      'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800',
    ],
  },
  {
    name: 'Brazil', capital: 'Brasília', population: '215 Triệu',
    description: 'Quê hương của vũ điệu Samba sôi động, những huyền thoại bóng đá và là nơi ôm trọn phần lớn rừng rậm nhiệt đới Amazon - lá phổi xanh của Trái Đất.',
    color: '#10b981', lat: -15.7938, lng: -47.8827,
    flag: '🇧🇷', area: '8.516.000 km²', language: 'Tiếng Bồ Đào Nha', currency: 'Real (BRL)',
    continent: 'Châu Mỹ',
    funFact: 'Rừng Amazon ở Brazil chiếm hơn 60% tổng diện tích rừng nhiệt đới toàn cầu.',
    images: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      'https://images.unsplash.com/photo-1544989164-31b5e2ebfe00?w=800',
    ],
  },
  {
    name: 'Australia', capital: 'Canberra', population: '26 Triệu',
    description: 'Đảo quốc khổng lồ nằm giữa đại dương, nổi tiếng với những chú Kangaroo độc đáo, Nhà hát Con Sò và rạn san hô Great Barrier tuyệt mỹ.',
    color: '#f59e0b', lat: -35.2809, lng: 149.1300,
    flag: '🇦🇺', area: '7.692.000 km²', language: 'Tiếng Anh', currency: 'Đô la Úc (AUD)',
    continent: 'Châu Đại Dương',
    funFact: 'Australia là lục địa duy nhất cũng là một quốc gia, đồng thời là châu lục nhỏ nhất thế giới.',
    images: [
      'https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ],
  },
  {
    name: 'Ai Cập', capital: 'Cairo', population: '111 Triệu',
    description: 'Vùng đất huyền bí của các vị Pharaoh, gắn liền với dòng sông Nile vĩ đại và những Kim tự tháp ngàn năm tuổi đứng sừng sững giữa sa mạc.',
    color: '#eab308', lat: 30.0444, lng: 31.2357,
    flag: '🇪🇬', area: '1.002.000 km²', language: 'Tiếng Ả Rập', currency: 'Bảng Ai Cập (EGP)',
    continent: 'Châu Phi',
    funFact: 'Kim tự tháp Giza là công trình duy nhất trong 7 kỳ quan thế giới cổ đại còn tồn tại đến ngày nay.',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73ce1?w=800',
      'https://images.unsplash.com/photo-1452702703976-8c977a6a5c3b?w=800',
    ],
  },
  {
    name: 'Ấn Độ', capital: 'New Delhi', population: '1.4 Tỷ',
    description: 'Quốc gia đông dân nhất nhì thế giới với nền văn hóa đa dạng, rực rỡ sắc màu, lăng Taj Mahal huyền thoại và dòng sông Hằng linh thiêng.',
    color: '#f97316', lat: 28.6139, lng: 77.2090,
    flag: '🇮🇳', area: '3.287.000 km²', language: 'Hindi, Tiếng Anh', currency: 'Rupee (INR)',
    continent: 'Châu Á',
    funFact: 'Ấn Độ có hơn 1600 ngôn ngữ và phương ngữ khác nhau, là một trong những quốc gia đa ngôn ngữ nhất thế giới.',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800',
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
    ],
  },
  {
    name: 'Vương quốc Anh', capital: 'London', population: '67 Triệu',
    description: 'Xứ sở sương mù với bề dày lịch sử, nơi khởi nguồn của cuộc Cách mạng Công nghiệp và nổi tiếng với tháp đồng hồ Big Ben.',
    color: '#6366f1', lat: 51.5072, lng: -0.1276,
    flag: '🇬🇧', area: '242.495 km²', language: 'Tiếng Anh', currency: 'Bảng Anh (GBP)',
    continent: 'Châu Âu',
    funFact: 'Nước Anh không có hiến pháp thành văn — hệ thống pháp lý của họ dựa trên các luật lệ tích lũy hơn 800 năm.',
    images: [
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
    ],
  },
  {
    name: 'Liên bang Nga', capital: 'Moscow', population: '143 Triệu',
    description: 'Quốc gia có diện tích lớn nhất thế giới, trải dài trên cả hai châu lục Á - Âu với thiên nhiên vô cùng phong phú và những mùa đông trắng tuyết.',
    color: '#8b5cf6', lat: 55.7558, lng: 37.6173,
    flag: '🇷🇺', area: '17.098.000 km²', language: 'Tiếng Nga', currency: 'Ruble (RUB)',
    continent: 'Châu Âu / Á',
    funFact: 'Nga trải dài qua 11 múi giờ — đủ để bay từ điểm cực đông sang cực tây mất hơn 9 tiếng.',
    images: [
      'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    ],
  },
  {
    name: 'Canada', capital: 'Ottawa', population: '39 Triệu',
    description: 'Đất nước của những chiếc lá phong đỏ, vô số hồ nước ngọt trong xanh và những đỉnh núi phủ tuyết trắng thuộc dãy Rocky hùng vĩ.',
    color: '#14b8a6', lat: 45.4215, lng: -75.6972,
    flag: '🇨🇦', area: '9.985.000 km²', language: 'Tiếng Anh, Pháp', currency: 'Đô la Canada (CAD)',
    continent: 'Châu Mỹ',
    funFact: 'Canada sở hữu đường bờ biển dài nhất thế giới với hơn 202.080 km.',
    images: [
      'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
      'https://images.unsplash.com/photo-1444628838545-ac4016a5418a?w=800',
    ],
  },
  {
    name: 'Nam Phi', capital: 'Pretoria', population: '60 Triệu',
    description: 'Quốc gia nằm ở cực nam châu Phi, được mệnh danh là "Đất nước Cầu vồng" với hệ sinh thái hoang dã hoành tráng và mũi Hảo Vọng lịch sử.',
    color: '#d946ef', lat: -25.7479, lng: 28.2293,
    flag: '🇿🇦', area: '1.221.000 km²', language: '11 ngôn ngữ chính thức', currency: 'Rand (ZAR)',
    continent: 'Châu Phi',
    funFact: 'Nam Phi là quốc gia duy nhất trên thế giới có 3 thủ đô: Pretoria (hành chính), Cape Town (lập pháp) và Bloemfontein (tư pháp).',
    images: [
      'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800',
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    ],
  },
];

// ── GET: fetch all countries (public) ─────────────────────────────────────────
export async function GET() {
  await dbConnect();

  let countries = await Country.find().sort({ name: 1 }).lean();

  // Seed default data if empty
  if (countries.length === 0) {
    await Country.insertMany(DEFAULT_COUNTRIES);
    countries = await Country.find().sort({ name: 1 }).lean();
  }

  return NextResponse.json({ countries });
}

// ── POST: create a new country (role=1 only) ──────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user || user.role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const country = await Country.create(body);
  return NextResponse.json({ country }, { status: 201 });
}
