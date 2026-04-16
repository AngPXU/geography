export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardLesson {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  cards: Flashcard[];
}

export interface FlashcardGrade {
  grade: number;
  label: string;
  grad: string;        // Tailwind gradient classes
  shadow: string;      // Tailwind shadow class
  icon: string;
  lessons: FlashcardLesson[];
}

export const FLASHCARD_DATA: FlashcardGrade[] = [
  // ──────────────────────────────────────────────────────
  // LỚP 6
  // ──────────────────────────────────────────────────────
  {
    grade: 6,
    label: 'Lớp 6',
    grad: 'from-cyan-400 to-blue-500',
    shadow: 'shadow-cyan-200',
    icon: '🌍',
    lessons: [
      {
        id: '6-1',
        title: 'Bài 1: Trái Đất trong Hệ Mặt Trời',
        subtitle: '12 thẻ',
        icon: '🌏',
        cards: [
          { id: '6-1-1', front: 'Trái Đất', back: 'Hành tinh thứ 3 tính từ Mặt Trời, khoảng cách ~150 triệu km. Duy nhất trong hệ Mặt Trời có sự sống được xác nhận.' },
          { id: '6-1-2', front: 'Hệ Mặt Trời', back: 'Gồm Mặt Trời ở trung tâm và 8 hành tinh quay xung quanh: Sao Thủy → Sao Kim → Trái Đất → Sao Hỏa → Sao Mộc → Sao Thổ → Sao Thiên Vương → Sao Hải Vương.' },
          { id: '6-1-3', front: 'Chuyển động tự quay', back: 'Trái Đất tự quay quanh trục từ Tây → Đông, một vòng = 24 giờ. Hệ quả: sinh ra ngày và đêm, làm lệch hướng chuyển động.' },
          { id: '6-1-4', front: 'Chuyển động công chuyển', back: 'Trái Đất quay quanh Mặt Trời ngược chiều kim đồng hồ, một vòng = 365 ngày 6 giờ. Hệ quả: bốn mùa và ngày dài/ngắn theo mùa.' },
          { id: '6-1-5', front: 'Vĩ tuyến', back: 'Đường nối các điểm có cùng vĩ độ, chạy hướng Đông–Tây, song song với Xích đạo. Vĩ tuyến quan trọng: 0° (Xích đạo), 23°27′, 66°33°, 90° (cực).' },
          { id: '6-1-6', front: 'Kinh tuyến', back: 'Đường nối Bắc cực và Nam cực, chạy hướng Bắc–Nam. Kinh tuyến gốc 0° qua Greenwich (Anh). Chia thành kinh tuyến Đông (0°→180°) và Tây (0°→180°).' },
          { id: '6-1-7', front: 'Xích đạo', back: 'Vĩ tuyến lớn nhất (0°), chia Trái Đất thành Bán cầu Bắc và Nam. Điểm nóng nhất, nhận ánh sáng mặt trời nhiều nhất trong năm.' },
          { id: '6-1-8', front: 'Chí tuyến Bắc', back: 'Vĩ tuyến 23°27′B. Mặt Trời lên thiên đỉnh ngày 22/6 (hạ chí). Ranh giới phía Bắc của vùng nhiệt đới.' },
          { id: '6-1-9', front: 'Chí tuyến Nam', back: 'Vĩ tuyến 23°27′N. Mặt Trời lên thiên đỉnh ngày 22/12 (đông chí). Ranh giới phía Nam của vùng nhiệt đới.' },
          { id: '6-1-10', front: 'Vòng cực Bắc', back: 'Vĩ tuyến 66°33′B. Phía trên xuất hiện ngày hoặc đêm kéo dài 24 giờ theo mùa. Tương ứng: Vòng cực Nam ở 66°33′N.' },
          { id: '6-1-11', front: 'Múi giờ', back: 'Trái Đất chia 24 múi giờ, mỗi múi rộng 15° kinh độ. Việt Nam ở GMT+7. Đường đổi ngày quốc tế ở kinh tuyến 180°.' },
          { id: '6-1-12', front: 'Tọa độ địa lý', back: 'Xác định vị trí bằng 2 trị số: kinh độ (Đ hoặc T) và vĩ độ (B hoặc N). VD: Hà Nội ≈ 21°B, 105°Đ.' },
        ],
      },
      {
        id: '6-2',
        title: 'Bài 2: Bản Đồ Và Ký Hiệu',
        subtitle: '10 thẻ',
        icon: '🗺️',
        cards: [
          { id: '6-2-1', front: 'Bản đồ', back: 'Hình vẽ thu nhỏ tương đối chính xác về một khu vực hay toàn bộ bề mặt Trái Đất trên mặt phẳng, theo tỉ lệ nhất định.' },
          { id: '6-2-2', front: 'Tỉ lệ bản đồ 1:1.000.000', back: '1 cm trên bản đồ = 10 km ngoài thực địa. Tỉ lệ càng lớn (VD 1:100.000) → bản đồ càng chi tiết, diện tích thể hiện càng nhỏ.' },
          { id: '6-2-3', front: 'Ký hiệu điểm', back: 'Ký hiệu hình học, chữ viết hoặc tượng hình đặt tại một điểm: thành phố, cảng, mỏ khoáng sản, đỉnh núi...' },
          { id: '6-2-4', front: 'Ký hiệu đường', back: 'Biểu thị đối tượng có chiều dài: sông, đường giao thông, ranh giới hành chính, đường bờ biển...' },
          { id: '6-2-5', front: 'Đường đồng mức', back: 'Đường nối các điểm có cùng độ cao so với mực nước biển. Đường càng gần nhau → địa hình càng dốc.' },
          { id: '6-2-6', front: 'Phương hướng trên bản đồ', back: 'Mạc định: lên = Bắc, xuống = Nam, phải = Đông, trái = Tây. Nếu có mũi tên Bắc riêng → theo mũi tên đó.' },
          { id: '6-2-7', front: 'Kinh độ', back: 'Khoảng cách góc từ kinh tuyến gốc (0°) đến kinh tuyến qua điểm đó. Phạm vi 0°–180°Đ hoặc 0°–180°T.' },
          { id: '6-2-8', front: 'Vĩ độ', back: 'Khoảng cách góc từ Xích đạo (0°) đến vĩ tuyến qua điểm đó. Phạm vi 0°–90°B hoặc 0°–90°N.' },
          { id: '6-2-9', front: 'Bảng chú giải', back: 'Bảng giải thích ý nghĩa các ký hiệu trên bản đồ, thường ở góc dưới. Không có chú giải → không đọc được bản đồ.' },
          { id: '6-2-10', front: 'Phép chiếu bản đồ', back: 'Cách chuyển bề mặt cong của Trái Đất lên mặt phẳng. Không thể hoàn toàn chính xác → luôn có sai số về diện tích, hình dạng, hoặc khoảng cách.' },
        ],
      },
      {
        id: '6-3',
        title: 'Bài 3: Cấu Trúc Trái Đất',
        subtitle: '8 thẻ',
        icon: '🌋',
        cards: [
          { id: '6-3-1', front: 'Vỏ Trái Đất', back: 'Lớp ngoài cùng, mỏng 5–70 km. Vỏ đại dương (5–10 km, dày basalt) và vỏ lục địa (30–70 km). Cứng và nguội nhất.' },
          { id: '6-3-2', front: 'Lớp Manti', back: 'Dày ~2.900 km, nhiệt độ 1.000–3.700°C. Phần trên (asthenosphere) dạng bán lỏng, các mảng kiến tạo trôi nổi trên đó.' },
          { id: '6-3-3', front: 'Nhân Trái Đất', back: 'Bán kính ~3.500 km. Nhân ngoài: lỏng (sắt + niken, 4.000–5.000°C). Nhân trong: rắn (5.000–6.000°C). Tạo ra từ trường Trái Đất.' },
          { id: '6-3-4', front: 'Mảng kiến tạo', back: '7 mảng lớn: Thái Bình Dương, Á-Âu, Bắc Mỹ, Nam Mỹ, Châu Phi, Ấn Độ-Úc, Nam Cực. Di chuyển vài cm/năm trên lớp manti.' },
          { id: '6-3-5', front: 'Núi lửa', back: 'Nơi macma phun trào qua miệng núi lên bề mặt. Hình thành ở ranh giới mảng kiến tạo hoặc điểm nóng. Macma trên mặt gọi là dung nham.' },
          { id: '6-3-6', front: 'Động đất', back: 'Rung chuyển đột ngột do đứt gãy địa chất, va chạm mảng hoặc hoạt động núi lửa. Đo bằng thang Richter. Điểm chấn tâm là nơi rung mạnh nhất.' },
          { id: '6-3-7', front: 'Vành đai lửa Thái Bình Dương', back: 'Khu vực hình móng ngựa quanh Thái Bình Dương, chiếm 75% núi lửa và 90% động đất thế giới. Do nhiều ranh giới mảng hội tụ ở đây.' },
          { id: '6-3-8', front: 'Tạo núi', back: 'Quá trình hình thành núi khi hai mảng kiến tạo va chạm, đẩy vỏ Trái Đất lên cao. VD: Himalaya do mảng Ấn Độ va vào mảng Á-Âu.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────
  // LỚP 7
  // ──────────────────────────────────────────────────────
  {
    grade: 7,
    label: 'Lớp 7',
    grad: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-200',
    icon: '🌿',
    lessons: [
      {
        id: '7-1',
        title: 'Bài 1: Môi Trường Nhiệt Đới',
        subtitle: '10 thẻ',
        icon: '🌴',
        cards: [
          { id: '7-1-1', front: 'Môi trường xích đạo ẩm', back: 'Quanh xích đạo (khoảng 5°B–5°N). Nóng ẩm quanh năm, mưa >2.000 mm/năm, không có mùa khô rõ rệt. Rừng nhiệt đới rậm rạp.' },
          { id: '7-1-2', front: 'Môi trường nhiệt đới gió mùa', back: 'Nam Á, Đông Nam Á. Hai mùa rõ: mùa mưa (gió từ biển vào) và mùa khô (gió từ lục địa ra). Lúa gạo là cây trồng chính.' },
          { id: '7-1-3', front: 'Rừng nhiệt đới ẩm', back: 'Đa dạng sinh học nhất Trái Đất, 50% loài sinh vật. Amazon (Nam Mỹ) và Congo (Châu Phi) là hai khu lớn nhất. Bị chặt phá nghiêm trọng.' },
          { id: '7-1-4', front: 'Xavan nhiệt đới', back: 'Cỏ cao, cây bụi rải rác, không thành rừng rậm. Phổ biến ở châu Phi (mùa khô kéo dài). Nơi sinh sống của sư tử, voi, hươu cao cổ...' },
          { id: '7-1-5', front: 'Gió mùa', back: 'Gió đổi chiều theo mùa do sự chênh lệch nhiệt độ giữa đất liền và biển. Mùa hè: từ biển vào (mưa). Mùa đông: từ lục địa ra (khô).' },
          { id: '7-1-6', front: 'Châu Phi', back: 'Lớn thứ 2 (30,3 triệu km²). Xích đạo cắt gần giữa. Sa mạc Sahara chiếm hơn 1/3. Sông Nile dài nhất thế giới. Dân số 1,4 tỷ người.' },
          { id: '7-1-7', front: 'Sa mạc Sahara', back: 'Sa mạc nóng lớn nhất thế giới (~9,2 triệu km²), trải dài Bắc Phi. Nhiệt độ ngày lên 50°C, đêm xuống 0°C. Hầu như không có mưa.' },
          { id: '7-1-8', front: 'Sông Nile', back: 'Sông dài nhất thế giới (~6.650 km), chảy từ hồ Victoria (Đông Phi) qua Sudan, Ai Cập, đổ ra Địa Trung Hải. Nền văn minh Ai Cập cổ đại phát sinh bên bờ sông Nile.' },
          { id: '7-1-9', front: 'El Niño', back: 'Hiện tượng mực nước biển ấm bất thường ở Thái Bình Dương, xảy ra 2–7 năm/lần, gây hạn hán ở vùng này và lũ lụt ở vùng khác. Ảnh hưởng toàn cầu.' },
          { id: '7-1-10', front: 'Hoang mạc', back: 'Vùng đất nhận lượng mưa <250 mm/năm. Gồm: hoang mạc nóng (Sahara) và hoang mạc lạnh (Nam Cực). Chiếm ~1/3 diện tích lục địa.' },
        ],
      },
      {
        id: '7-2',
        title: 'Bài 2: Châu Á',
        subtitle: '12 thẻ',
        icon: '🌏',
        cards: [
          { id: '7-2-1', front: 'Châu Á', back: 'Lớn nhất (44,5 triệu km²), đông dân nhất (~4,7 tỷ người). Trải dài từ cực Bắc đến xích đạo, từ Địa Trung Hải đến Thái Bình Dương.' },
          { id: '7-2-2', front: 'Núi Everest', back: 'Đỉnh cao nhất thế giới: 8.849 m, nằm ở biên giới Nepal–Trung Quốc (dãy Himalaya). Phân kìm đầu tiên year 1953 (Hillary & Tenzing Norgay).' },
          { id: '7-2-3', front: 'Dãy Himalaya', back: 'Dãy núi cao nhất thế giới, dài ~2.400 km qua Nepal, Ấn Độ, Bhutan, Tây Tạng. Hình thành từ 50 triệu năm trước khi mảng Ấn Độ va vào mảng Á-Âu.' },
          { id: '7-2-4', front: 'Sông Dương Tử', back: 'Sông dài nhất châu Á (~6.300 km), chảy qua Trung Quốc từ Tây sang Đông. Đập Tam Hiệp là đập thủy điện lớn nhất thế giới trên sông này.' },
          { id: '7-2-5', front: 'Sông Mê Kông', back: 'Dài ~4.900 km, bắt nguồn từ Tây Tạng, chảy qua Trung Quốc, Myanmar, Lào, Thái Lan, Campuchia và đổ ra Biển Đông tại ĐBSCL (Việt Nam).' },
          { id: '7-2-6', front: 'Đông Nam Á', back: '11 quốc gia (10 thành viên ASEAN + Timor-Leste). Gồm Đông Nam Á lục địa và hải đảo. Khí hậu nhiệt đới gió mùa. Đa dạng văn hóa.' },
          { id: '7-2-7', front: 'ASEAN', back: 'Hiệp hội các Quốc gia Đông Nam Á, thành lập 1967. 10 thành viên: Việt Nam, Thái Lan, Indonesia, Malaysia, Philippines, Singapore, Brunei, Campuchia, Lào, Myanmar.' },
          { id: '7-2-8', front: 'Biển Chết', back: 'Hồ nước mặn giữa Israel–Jordan, thấp nhất Trái Đất (~−430 m). Mặn gấp 8–10 lần đại dương, không có sinh vật sống. Nổi bật khi tắm.' },
          { id: '7-2-9', front: 'Đồng bằng Tây Siberi', back: 'Đồng bằng lớn nhất thế giới (~2,7 triệu km²), ở Nga phía Tây dãy Ural. Bằng phẳng, đầm lầy nhiều. Lạnh giá khắc nghiệt mùa đông.' },
          { id: '7-2-10', front: 'Bán đảo Ả Rập', back: 'Bán đảo lớn nhất thế giới (~3,2 triệu km²). Gồm Saudi Arabia, UAE, Qatar, Oman... Giàu dầu mỏ nhất thế giới. Khí hậu khô nóng.' },
          { id: '7-2-11', front: 'Đại dương Thái Bình Dương', back: 'Lớn nhất thế giới, chiếm 1/3 Trái Đất (~165 triệu km²). Điểm sâu nhất: Rãnh Mariana (~11.034 m). Có vành đai lửa bao quanh.' },
          { id: '7-2-12', front: 'Biển Đông', back: 'Biển bán kín ở Đông Nam Á, diện tích ~3,5 triệu km². Việt Nam có đường bờ biển 3.260 km giáp biển này. Tuyến hàng hải quan trọng bậc nhất thế giới.' },
        ],
      },
      {
        id: '7-3',
        title: 'Bài 3: Châu Âu & Bắc Mỹ',
        subtitle: '10 thẻ',
        icon: '🏰',
        cards: [
          { id: '7-3-1', front: 'Châu Âu', back: 'Nhỏ thứ 2 (~10,5 triệu km²), nhưng phát triển kinh tế nhất. Phần lớn thuộc đới ôn hòa. Có Liên minh châu Âu (EU) với 27 thành viên.' },
          { id: '7-3-2', front: 'Dãy Alps', back: 'Dãy núi cao nhất Tây Âu, kéo dài qua Pháp, Thụy Sĩ, Áo, Italy... Đỉnh cao nhất: Mont Blanc 4.808 m. Nguồn gốc sông Rhine, Rhine, Rhone.' },
          { id: '7-3-3', front: 'Sông Rhine', back: 'Sông quan trọng nhất Tây Âu, dài ~1.230 km, chảy từ Alps qua Đức, Hà Lan. Tuyến giao thông đường thủy nội địa nhộn nhịp bậc nhất châu Âu.' },
          { id: '7-3-4', front: 'Địa Trung Hải', back: 'Biển giữa châu Âu, châu Phi và châu Á. Khí hậu Địa Trung Hải: hè nóng khô, đông ấm có mưa. Nổi tiếng về du lịch và văn hóa.' },
          { id: '7-3-5', front: 'Bắc Mỹ', back: 'Lục địa lớn thứ 3 (~24,7 triệu km²). Chủ yếu gồm: Canada, Mỹ, Mexico. Địa hình đa dạng: núi Rocky ở Tây, đồng bằng ở giữa, dãy Appalachian ở Đông.' },
          { id: '7-3-6', front: 'Sông Mississippi', back: 'Sông dài nhất Bắc Mỹ (~3.400 km) cùng phụ lưu Missouri, chảy qua trung tâm nước Mỹ ra Vịnh Mexico. Hệ thống giao thông thủy quan trọng.' },
          { id: '7-3-7', front: 'Ngũ Đại Hồ', back: '5 hồ nước ngọt lớn nhất thế giới ở biên giới Mỹ–Canada: Superior, Michigan, Huron, Erie, Ontario. Chứa 21% nước ngọt bề mặt Trái Đất.' },
          { id: '7-3-8', front: 'Grand Canyon', back: 'Hẻm núi khổng lồ ở bang Arizona (Mỹ), sâu ~1.600 m, dài ~446 km, do sông Colorado bào mòn qua hàng triệu năm. Di sản thiên nhiên UNESCO.' },
          { id: '7-3-9', front: 'Amazon', back: 'Sông lớn nhất thế giới tính theo lưu lượng nước (~6.400 km), chảy qua Brazil. Rừng Amazon là lá phổi xanh của Trái Đất, chiếm 10% sinh khối Trái Đất.' },
          { id: '7-3-10', front: 'Andes', back: 'Dãy núi dài nhất thế giới (~7.000 km) dọc bờ Tây Nam Mỹ. Nơi có nhiều núi lửa đang hoạt động, nhiều dân tộc bản địa sinh sống.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────
  // LỚP 8
  // ──────────────────────────────────────────────────────
  {
    grade: 8,
    label: 'Lớp 8',
    grad: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-200',
    icon: '🇻🇳',
    lessons: [
      {
        id: '8-1',
        title: 'Bài 1: Vị Trí & Lãnh Thổ Việt Nam',
        subtitle: '10 thẻ',
        icon: '📍',
        cards: [
          { id: '8-1-1', front: 'Vị trí địa lý Việt Nam', back: 'Rìa phía Đông bán đảo Đông Dương, từ 8°34′B–23°23′B và 102°09′Đ–109°24′Đ. Tiếp giáp: Trung Quốc (Bắc), Lào & Campuchia (Tây), Biển Đông (Đông & Nam).' },
          { id: '8-1-2', front: 'Diện tích Việt Nam', back: '331.212 km², dài ~1.650 km theo chiều Bắc–Nam. Nơi hẹp nhất: tỉnh Quảng Bình (~50 km). Đứng thứ 65 thế giới về diện tích.' },
          { id: '8-1-3', front: 'Đường bờ biển', back: 'Dài 3.260 km từ Móng Cái (Quảng Ninh) đến Hà Tiên (Kiên Giang). Bờ biển phức tạp, nhiều vịnh, bán đảo, đảo và quần đảo.' },
          { id: '8-1-4', front: 'Vùng biển Việt Nam', back: 'Rộng ~1 triệu km², gồm: nội thủy, lãnh hải (12 hải lý), vùng tiếp giáp (24 hải lý), vùng đặc quyền kinh tế (200 hải lý) và thềm lục địa.' },
          { id: '8-1-5', front: 'Hoàng Sa & Trường Sa', back: 'Hoàng Sa thuộc Đà Nẵng, Trường Sa thuộc Khánh Hòa. Hai quần đảo khẳng định chủ quyền biển đảo, giàu tài nguyên và vị trí chiến lược.' },
          { id: '8-1-6', front: 'Ý nghĩa vị trí địa lý', back: 'Nằm ở ngã tư hàng hải và hàng không quốc tế. Cầu nối ĐNA lục địa và hải đảo. Khí hậu nhiệt đới gió mùa, đa dạng sinh học cao.' },
          { id: '8-1-7', front: 'Hình dạng lãnh thổ', back: 'Hình chữ S kéo dài, hẹp ngang. Gần như đối xứng qua vĩ tuyến 16°B. Tạo sự chia cắt địa hình và đa dạng khí hậu Bắc–Nam.' },
          { id: '8-1-8', front: 'Vùng đặc quyền kinh tế', back: '200 hải lý (~370 km) tính từ đường cơ sở. VN có toàn quyền khai thác tài nguyên (cá, dầu khí...). Khoảng 25 tỷ thùng dầu dự trữ.' },
          { id: '8-1-9', front: 'Đảo Phú Quốc', back: 'Đảo lớn nhất Việt Nam (~589 km²), thuộc Kiên Giang. Được mệnh danh "đảo ngọc". Phát triển du lịch, kinh tế cửa khẩu và nuôi trồng thủy sản.' },
          { id: '8-1-10', front: 'Múi giờ Việt Nam', back: 'Múi giờ GMT+7 (Indochina Time). Khi Hà Nội 12 giờ trưa → London 5 giờ sáng, Tokyo 14 giờ, Los Angeles 21 giờ hôm trước.' },
        ],
      },
      {
        id: '8-2',
        title: 'Bài 2: Địa Hình Việt Nam',
        subtitle: '10 thẻ',
        icon: '⛰️',
        cards: [
          { id: '8-2-1', front: 'Đặc điểm địa hình VN', back: '3/4 diện tích là đồi núi, 1/4 là đồng bằng. Địa hình thấp dần từ Tây Bắc → Đông Nam. Chủ yếu là núi thấp (dưới 1.000 m).' },
          { id: '8-2-2', front: 'Dãy Hoàng Liên Sơn', back: 'Dài ~180 km theo hướng TB–ĐN, cao nhất Việt Nam. Có đỉnh Phan Xi Păng (3.143 m) – cao nhất Đông Dương, còn gọi "Nóc nhà Đông Dương".' },
          { id: '8-2-3', front: 'Đồng bằng sông Hồng', back: 'Khoảng 15.000 km², do sông Hồng và Thái Bình bồi đắp. Dân cư đông đúc, là trung tâm kinh tế–văn hóa phía Bắc. Đất phù sa màu mỡ.' },
          { id: '8-2-4', front: 'Đồng bằng sông Cửu Long', back: 'Lớn nhất VN (~40.000 km²), do sông Mê Kông bồi đắp. Vựa lúa và thủy sản lớn nhất cả nước. Thấp, nhiều kênh rạch, bị ảnh hưởng bởi xâm nhập mặn.' },
          { id: '8-2-5', front: 'Tây Nguyên', back: 'Cao nguyên rộng ở Nam Trung Bộ: Kon Tum, Gia Lai, Đắk Lắk, Đắk Nông, Lâm Đồng. Đất bazan, trồng cà phê–cao su–hồ tiêu. Nhà nước tây Trường Sơn.' },
          { id: '8-2-6', front: 'Vịnh Hạ Long', back: 'Di sản thiên nhiên thế giới UNESCO (1994, 2000). Tỉnh Quảng Ninh, có 1.969 đảo đá vôi karst. Diện tích 1.553 km². Kỳ quan thiên nhiên mới thế giới (2011).' },
          { id: '8-2-7', front: 'Đèo Hải Vân', back: 'Cao ~496 m, trên QL1A, ranh giới tự nhiên Đà Nẵng–Thừa Thiên Huế. Là "bức tường khí hậu" chia cắt thời tiết Bắc và Nam Trung Bộ.' },
          { id: '8-2-8', front: 'Trường Sơn Nam', back: 'Dãy núi thuộc miền Trung–Tây Nguyên, chạy theo hướng Bắc–Nam. Sườn Đông dốc, ngắn; sườn Tây thoải, rộng. Địa bàn chiến lược trong chiến tranh.' },
          { id: '8-2-9', front: 'Đồng bằng ven biển miền Trung', back: 'Dải đồng bằng hẹp ngang, trải từ Thanh Hóa đến Bình Thuận. Thường bị lũ lụt và hạn hán. Đất kém màu mỡ hơn vùng đồng bằng khác.' },
          { id: '8-2-10', front: 'Sông Hồng', back: 'Sông lớn nhất miền Bắc, dài 1.149 km (trong đó ~510 km ở VN), bắt nguồn từ Vân Nam–Trung Quốc. Chở nhiều phù sa, tạo đồng bằng sông Hồng.' },
        ],
      },
      {
        id: '8-3',
        title: 'Bài 3: Khí Hậu Việt Nam',
        subtitle: '8 thẻ',
        icon: '🌤️',
        cards: [
          { id: '8-3-1', front: 'Khí hậu nhiệt đới gió mùa', back: 'Đặc điểm chủ đạo của VN: nóng ẩm, nhiều mưa. Nhiệt độ TB >20°C. Lượng mưa 1.500–2.000 mm/năm. Tính chất phân hóa mạnh theo mùa và theo vùng.' },
          { id: '8-3-2', front: 'Gió mùa Đông Bắc', back: 'Thổi vào mùa đông (tháng 11–4) từ lục địa Á–Âu xuống. Mang theo không khí lạnh và khô cho miền Bắc. Gây rét buốt, nhiệt độ đôi khi dưới 5°C.' },
          { id: '8-3-3', front: 'Gió mùa Tây Nam', back: 'Thổi vào mùa hè (tháng 5–10) từ Ấn Độ Dương vào. Mang hơi ẩm gây mưa lớn. Khi vượt qua dãy Trường Sơn trở thành gió Lào (khô nóng).' },
          { id: '8-3-4', front: 'Gió Lào (Gió Tây khô nóng)', back: 'Gió mùa Tây Nam sau khi vượt dãy Trường Sơn xuống vùng Bắc Trung Bộ trở nên khô và nóng. Nhiệt độ lên 40°C, độ ẩm thấp. Hại cây trồng.' },
          { id: '8-3-5', front: 'Bão nhiệt đới', back: 'VN nằm trên đường đi của bão từ Thái Bình Dương vào Biển Đông. Trung bình 6–8 cơn bão/năm, tập trung tháng 6–12. Ảnh hưởng nặng miền Trung.' },
          { id: '8-3-6', front: 'Phân hóa khí hậu Bắc–Nam', back: 'Miền Bắc: 4 mùa rõ rệt, mùa đông lạnh. Miền Nam: 2 mùa (mưa/khô), nóng quanh năm. Ranh giới: đèo Hải Vân (~16°B).' },
          { id: '8-3-7', front: 'Lũ lụt miền Trung', back: 'Do địa hình hẹp, dốc; bão thường vào tháng 9–12; mưa lớn tập trung. Lũ quét và lũ ống thường xuyên gây thiệt hại nặng cho miền Trung.' },
          { id: '8-3-8', front: 'Khí hậu Đà Lạt', back: 'Cao nguyên Lâm Đồng (1.500 m), khí hậu ôn hòa quanh năm, TB 17–18°C. Không có mùa hè nóng, được gọi là "thành phố mùa xuân", trồng rau và hoa.' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────
  // LỚP 9
  // ──────────────────────────────────────────────────────
  {
    grade: 9,
    label: 'Lớp 9',
    grad: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-200',
    icon: '🏭',
    lessons: [
      {
        id: '9-1',
        title: 'Bài 1: Dân Số & Các Dân Tộc',
        subtitle: '10 thẻ',
        icon: '👪',
        cards: [
          { id: '9-1-1', front: 'Dân số Việt Nam', back: 'Hơn 98 triệu người (2023), thứ 3 ĐNA (sau Indonesia, Philippines) và thứ 15 thế giới. Mật độ 295 người/km².' },
          { id: '9-1-2', front: '54 dân tộc Việt Nam', back: 'Kinh: 85,3% dân số. 53 dân tộc thiểu số sống chủ yếu ở miền núi và Tây Nguyên. Tày, Thái, Mường, Khmer, Mông... là các dân tộc đông dân.' },
          { id: '9-1-3', front: 'Gia tăng dân số tự nhiên', back: 'Tỉ lệ tăng tự nhiên = tỉ suất sinh − tỉ suất tử. Hiện ~1%/năm. VN đang trong thời kỳ dân số vàng, nhưng đang già hóa dần.' },
          { id: '9-1-4', front: 'Cơ cấu dân số theo tuổi', back: 'VN đang chuyển từ cơ cấu dân số trẻ sang dân số vàng (tỉ lệ người trong độ tuổi lao động cao nhất). Dự báo già hóa sau 2035.' },
          { id: '9-1-5', front: 'Phân bố dân cư', back: 'Không đồng đều: đông ở đồng bằng (đồng bằng sông Hồng ~1.000 người/km²), thưa ở miền núi (Tây Bắc, Tây Nguyên ~50 người/km²).' },
          { id: '9-1-6', front: 'Đô thị hóa Việt Nam', back: 'Tỉ lệ dân thành thị ~40%, đang tăng nhanh. Hai vùng đô thị lớn: Hà Nội và TP.HCM. Tốc độ đô thị hóa nhanh gây áp lực hạ tầng.' },
          { id: '9-1-7', front: 'Lực lượng lao động', back: '~55 triệu người, trẻ và đông. Lợi thế cạnh tranh nhưng cần nâng chất lượng. Xuất khẩu lao động sang Nhật, Hàn, Đài Loan là nguồn kiều hối đáng kể.' },
          { id: '9-1-8', front: 'Dân tộc Tày', back: 'Đông nhất trong dân tộc thiểu số (~1,9 triệu). Sinh sống chủ yếu ở Đông Bắc: Cao Bằng, Lạng Sơn, Thái Nguyên, Bắc Kạn. Trồng lúa nước, đánh cá.' },
          { id: '9-1-9', front: 'Di cư trong nước', back: 'Xu hướng di cư từ nông thôn ra thành thị và từ Bắc vào Nam. TP.HCM và Bình Dương là điểm đến chính. Gây "khoảng trống dân số" ở nơi xuất cư.' },
          { id: '9-1-10', front: 'Văn hóa cồng chiêng Tây Nguyên', back: 'Di sản văn hóa phi vật thể UNESCO (2005) của các dân tộc Tây Nguyên (Ê Đê, Ba Na, Gia Rai...). Cồng chiêng dùng trong lễ hội, nghi thức tín ngưỡng.' },
        ],
      },
      {
        id: '9-2',
        title: 'Bài 2: Kinh Tế Việt Nam',
        subtitle: '10 thẻ',
        icon: '💹',
        cards: [
          { id: '9-2-1', front: 'Cơ cấu kinh tế 3 khu vực', back: 'Khu vực I (Nông–Lâm–Thủy sản) ~12%, Khu vực II (Công nghiệp–Xây dựng) ~38%, Khu vực III (Dịch vụ) ~42% GDP. Đang chuyển dịch theo hướng CN–DV.' },
          { id: '9-2-2', front: 'Đổi Mới 1986', back: 'Chính sách cải cách kinh tế từ 1986, chuyển từ kế hoạch hóa tập trung sang kinh tế thị trường định hướng xã hội chủ nghĩa. Đưa VN thoát nghèo, hội nhập quốc tế.' },
          { id: '9-2-3', front: 'Nông nghiệp Việt Nam', back: 'Lúa gạo: xuất khẩu top 3 thế giới. Cà phê: top 2 thế giới. Hạt tiêu: top 1. Thủy sản: top 3. Đất nông nghiệp ~10 triệu ha.' },
          { id: '9-2-4', front: 'Công nghiệp điện tử', back: 'Ngành xuất khẩu lớn nhất VN (điện thoại, linh kiện điện tử). Samsung ở Bắc Ninh và Thái Nguyên chiếm ~30% kim ngạch xuất khẩu cả nước.' },
          { id: '9-2-5', front: 'Vùng kinh tế trọng điểm phía Nam', back: 'Gồm TP.HCM, Bình Dương, Đồng Nai, Bà Rịa–Vũng Tàu. Đóng góp ~45% GDP cả nước. Trung tâm công nghiệp, tài chính, dịch vụ lớn nhất.' },
          { id: '9-2-6', front: 'Du lịch Việt Nam', back: 'Trước COVID: 18 triệu khách quốc tế/năm. Thu nhập ~700.000 tỷ đồng. Điểm nổi tiếng: Hạ Long, Hội An, Huế, Sa Pa, Phú Quốc, Đà Nẵng.' },
          { id: '9-2-7', front: 'Xuất nhập khẩu', back: 'Tổng kim ngạch XNK hơn 700 tỷ USD (2022), gấp đôi GDP. Xuất khẩu chính: điện thoại, điện tử, dệt may, giày dép, thủy sản, gỗ...' },
          { id: '9-2-8', front: 'Đồng bằng sông Cửu Long (kinh tế)', back: '50% sản lượng lúa, 70% trái cây, 40% thủy sản xuất khẩu của cả nước. Đang đối mặt: xâm nhập mặn, sụt lún, thiếu nước do thủy điện thượng nguồn.' },
          { id: '9-2-9', front: 'FDI vào Việt Nam', back: 'Đầu tư trực tiếp nước ngoài là động lực tăng trưởng. Nhà đầu tư lớn: Hàn Quốc, Nhật, Singapore, Đài Loan. Tổng FDI đăng ký: hơn 400 tỷ USD.' },
          { id: '9-2-10', front: 'Biến đổi khí hậu tại VN', back: 'VN là một trong các nước chịu ảnh hưởng nặng nhất. Nước biển dâng đe dọa đồng bằng sông Cửu Long. Bão mạnh hơn, hạn hán và lũ lụt cực đoan hơn.' },
        ],
      },
    ],
  },
];
