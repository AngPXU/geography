'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaFacebook, FaGithub, FaYoutube, FaMapMarkedAlt } from 'react-icons/fa';
import { Icon } from '@iconify/react';

// ── Accordion data ────────────────────────────────────────────────────────────

const TERMS_SECTIONS = [
  {
    title: '1. Giới thiệu & Phạm vi Áp dụng',
    body: 'Chào mừng bạn đến với Vui học Địa Lý (tên miền: vuihocdialy.com) — nền tảng học tập Địa lý trực tuyến được thiết kế chuyên biệt dành cho học sinh Trung học Cơ sở (THCS) tại Việt Nam. Bằng cách truy cập, đăng ký tài khoản hoặc sử dụng bất kỳ tính năng nào của Vui học Địa Lý, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi toàn bộ các điều khoản được quy định trong tài liệu này ("Điều khoản Dịch vụ"). Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ ngay lập tức. Điều khoản này áp dụng cho tất cả người dùng, bao gồm: Học sinh (tài khoản học tập), Giáo viên (tài khoản giảng dạy) và Quản trị viên hệ thống. Đối với người dùng dưới 18 tuổi, việc sử dụng dịch vụ cần có sự đồng ý và giám sát của cha mẹ hoặc người giám hộ hợp pháp.',
  },
  {
    title: '2. Tài khoản Người dùng',
    body: '• Đăng ký tài khoản: Để sử dụng đầy đủ tính năng, bạn cần đăng ký tài khoản với tên đăng nhập và mật khẩu. Các thông tin tùy chọn bổ sung bao gồm: họ tên, email, tên lớp, tên trường, tỉnh/thành phố và ảnh đại diện.\n • Bảo mật tài khoản: Bạn hoàn toàn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Không chia sẻ mật khẩu với bất kỳ ai. Nếu phát hiện tài khoản bị truy cập trái phép, hãy thông báo ngay cho chúng tôi qua nguyenthiman1011dh@gmail.com. \n • Trách nhiệm hoạt động: Mọi hành động được thực hiện thông qua tài khoản của bạn đều được xem là do bạn thực hiện, kể cả khi tài khoản bị người khác sử dụng do sơ suất bảo mật. \n • Thông tin chính xác: Bạn cam kết cung cấp thông tin trung thực, đầy đủ. Vui học Địa Lý có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện thông tin gian lận hoặc giả mạo. \n • Một tài khoản mỗi người: Mỗi người chỉ được sở hữu một tài khoản duy nhất. Tạo nhiều tài khoản để gian lận điểm số hoặc bảng xếp hạng là vi phạm nghiêm trọng.',
  },
  {
    title: '3. Tính năng & Dịch vụ',
    body: '• Bản đồ 3D tương tác: Công cụ khám phá địa lý qua mô phỏng bản đồ thế giới ba chiều, chỉ phục vụ mục đích học tập và giáo dục. Nghiêm cấm sử dụng cho mục đích thương mại khi chưa có sự cho phép bằng văn bản. \n • Lớp học trực tuyến: Giáo viên có quyền tạo lớp học, giao bài và quản lý học sinh. Học sinh tham gia lớp theo lời mời từ giáo viên. Mọi nội dung chia sẻ trong lớp phải tuân thủ Điều 5 (Quy định Nội dung). \n • Hệ thống Đấu trường (Arena): Tính năng thi đấu trắc nghiệm cho phép học sinh cạnh tranh lành mạnh. Điểm EXP và thứ hạng bảng xếp hạng được tính tự động theo thuật toán hệ thống. Gian lận trong thi đấu. \n •  Hệ thống Thú cưng (Pet): Tính năng nuôi thú cưng ảo như phần thưởng khuyến khích học tập. Thú cưng không có giá trị quy đổi thành tiền hay tài sản thực. \n • Thư viện Sách & Bài giảng: Nội dung biên soạn theo chương trình giáo dục THCS của Bộ Giáo dục và Đào tạo. Không được sao chép, phân phối lại tài liệu khi chưa được phép.',
  },
  {
    title: '4. Quyền Sở hữu Trí tuệ',
    body: '• Toàn bộ nội dung trên Vui học Địa Lý — bao gồm thiết kế giao diện, mã nguồn, cơ sở dữ liệu, bài giảng, câu hỏi trắc nghiệm, hình ảnh, mô hình 3D và tài liệu học tập — là tài sản trí tuệ của Vui học Địa Lý hoặc các đối tác cấp phép hợp pháp. \n • Người dùng được cấp giấy phép sử dụng cá nhân, không độc quyền để truy cập và sử dụng cho mục đích học tập. Giấy phép này không bao gồm quyền: sao chép thương mại, phân phối lại, tháo ngược mã nguồn hoặc tạo sản phẩm phái sinh. \n • Đối với nội dung do người dùng tạo ra (bài giảng của giáo viên, v.v.), bạn giữ quyền sở hữu nội dung của mình nhưng cấp cho Vui học Địa Lý quyền lưu trữ và hiển thị trong phạm vi dịch vụ.',
  },
  {
    title: '5. Quy định Nội dung',
    body: 'Người dùng tuyệt đối không được đăng tải các loại nội dung sau: \n • Bạo lực, kích động thù địch: Hình ảnh, ngôn từ kỳ thị chủng tộc, giới tính, bắt nạt hoặc đe dọa. \n • Nội dung không phù hợp lứa tuổi: Đặc biệt nghiêm cấm nội dung xâm phạm trẻ em. \n • Sai lệch địa lý & lịch sử: Xuyên tạc thông tin về lãnh thổ, chủ quyền quốc gia Việt Nam. \n • Mã độc & tấn công hệ thống: Virus, phần mềm độc hại, khai thác lỗ hổng bảo mật. \n • Spam & quảng cáo trái phép: Nội dung thương mại không liên quan đến học tập địa lý. \n Vi phạm sẽ dẫn đến xóa nội dung và có thể bị khóa tài khoản vĩnh viễn mà không cần thông báo trước.',
  },
  {
    title: '6. Chính sách Sử dụng Công bằng',
    body: '• Nghiêm cấm sử dụng bot, script tự động để gian lận EXP, cấp độ thú cưng hay thứ hạng. \n • Không được thực hiện các hành vi gây quá tải máy chủ, tấn công DDoS hoặc ảnh hưởng đến người dùng khác. \n • Truy cập tự động vào API hệ thống mà không có sự cho phép bằng văn bản là vi phạm điều khoản và có thể bị truy cứu pháp lý. \n • Học sinh, giáo viên và phụ huynh được khuyến khích xây dựng môi trường học tập tích cực, lành mạnh.',
  },
  {
    title: '7. Giới hạn Trách nhiệm',
    body: '• Vui học Địa Lý cung cấp dịch vụ trên cơ sở "nguyên trạng" và không bảo đảm dịch vụ hoàn toàn không bị gián đoạn hay không có lỗi. Trong phạm vi pháp luật Việt Nam cho phép, chúng tôi không chịu trách nhiệm về các thiệt hại gián tiếp phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.',
  },
  {
    title: '8. Chấm dứt Dịch vụ',
    body: 'Vui học Địa Lý có quyền tạm ngừng hoặc chấm dứt quyền truy cập nếu phát hiện vi phạm điều khoản, hành vi gian lận hoặc theo yêu cầu của cơ quan nhà nước có thẩm quyền. \n Người dùng có quyền yêu cầu xóa tài khoản bất kỳ lúc nào qua email nguyenthiman1011dh@gmail.com. Sau khi xóa, toàn bộ dữ liệu học tập sẽ bị xóa vĩnh viễn và không thể khôi phục.',
  },
  {
    title: '9. Luật Áp dụng & Giải quyết Tranh chấp',
    body: 'Điều khoản này được điều chỉnh theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, bao gồm Luật An toàn Thông tin mạng 2015, Luật Công nghệ Thông tin 2006 và Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân. Tranh chấp được giải quyết ưu tiên qua thương lượng, nếu không thành sẽ đưa ra Tòa án nhân dân có thẩm quyền tại Việt Nam.',
  },
  {
    title: '10. Liên hệ',
    body: 'Mọi thắc mắc, báo cáo, yêu cầu hỗ trợ, hoặc thông báo vi phạm, vui lòng liên hệ qua email chính thức: nguyenthiman1011dh@gmail.com. Chúng tôi cam kết phản hồi trong vòng 1 ngày làm việc.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1. Thông tin chúng tôi Thu thập',
    body: '• Thông tin đăng ký: Tên đăng nhập, mật khẩu (đã mã hóa), họ tên đầy đủ, địa chỉ email, tên lớp, tên trường, tỉnh/thành phố, xã/phường và ảnh đại diện. \n • Dữ liệu học tập: Điểm kinh nghiệm (EXP), chuỗi ngày học liên tiếp (streak), thời gian học trong ngày, lịch sử câu hỏi trắc nghiệm, tiến độ bài giảng, số xu (coins) và cấp độ thú cưng ảo (petExp). \n • Dữ liệu kỹ thuật: Địa chỉ IP (dùng để ghi nhận lần đăng nhập gần nhất và bảo mật tài khoản), loại trình duyệt và thời gian truy cập. IP chỉ được lưu trữ và sẽ bị xóa sau 90 ngày. \n • Nội dung người dùng tạo ra: Bài giảng do giáo viên soạn, câu hỏi Quiz tùy chỉnh, thông báo trong lớp học và các nội dung tương tác khác.',
  },
  {
    title: '2. Mục đích Sử dụng Thông tin',
    body: '• Vận hành dịch vụ: Xác thực đăng nhập, duy trì phiên làm việc, hiển thị hồ sơ cá nhân và đồng bộ tiến độ học tập trên mọi thiết bị. \n • Cải thiện trải nghiệm: Phân tích hành vi học tập để gợi ý nội dung phù hợp, tính toán thứ hạng bảng xếp hạng và cá nhân hóa theo cấp lớp. \n • Bảo mật & an toàn: Phát hiện hành vi gian lận, tấn công mạng hoặc vi phạm điều khoản; bảo vệ tài khoản khỏi truy cập trái phép. \n • Thông báo & hỗ trợ: Gửi thông báo về bài tập mới, kết quả thi, cập nhật hệ thống và phản hồi yêu cầu hỗ trợ kỹ thuật. \n • Tuân thủ pháp luật: Thực hiện nghĩa vụ theo pháp luật Việt Nam và phối hợp với cơ quan nhà nước khi có yêu cầu hợp lệ.',
  },
  {
    title: '3. Lưu trữ & Bảo mật Dữ liệu',
    body: 'Dữ liệu người dùng được lưu trữ trên hạ tầng đám mây an toàn với các biện pháp bảo vệ: \n • Mã hóa mật khẩu bằng thuật toán (không thể giải mã ngược). \n • Kết nối HTTPS/TLS cho mọi giao tiếp giữa trình duyệt và máy chủ. \n • Kiểm soát truy cập theo vai trò (Role-Based Access Control): học sinh không thể xem dữ liệu của nhau. \n • Sao lưu dữ liệu định kỳ để phòng ngừa mất mát. \n • Ảnh đại diện và file tài liệu được lưu trữ trên Supabase Storage với quy tắc bảo mật riêng biệt.',
  },
  {
    title: '4. Chia sẻ với Bên thứ ba',
    body: 'Vui học Địa Lý cam kết KHÔNG bán, cho thuê hay trao đổi thông tin cá nhân người dùng với bất kỳ bên thứ ba nào vì mục đích thương mại. \n • Thông tin chỉ được chia sẻ trong các trường hợp: \n • Với nhà cung cấp dịch vụ kỹ thuật (hosting, email) đã ký hợp đồng bảo mật. \n • Theo yêu cầu bắt buộc từ cơ quan pháp luật có thẩm quyền tại Việt Nam. \n • Trong trường hợp sáp nhập hoặc mua lại — người dùng sẽ được thông báo trước ít nhất 30 ngày. \n Lưu ý: Tên và thứ hạng trên Bảng Vàng Đấu Trường là thông tin công khai trong phạm vi nền tảng. Người dùng có thể yêu cầu ẩn tên qua cài đặt hồ sơ.',
  },
  {
    title: '5. Quyền của Người dùng',
    body: 'Theo Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân, bạn có các quyền sau: \n • Quyền truy cập: Yêu cầu xem toàn bộ thông tin cá nhân mà chúng tôi đang lưu trữ về bạn. \n • Quyền chỉnh sửa: Cập nhật thông tin cá nhân bất kỳ lúc nào tại trang Hồ sơ cá nhân. \n • Quyền xóa dữ liệu ("Quyền được lãng quên"): Yêu cầu xóa toàn bộ dữ liệu bằng cách gửi email đến nguyenthiman1011dh@gmail.com. Chúng tôi sẽ xử lý trong vòng 30 ngày. \n • Quyền phản đối: Phản đối việc xử lý dữ liệu trong một số trường hợp nhất định theo quy định pháp luật. \n • Quyền rút lại đồng ý: Rút lại sự đồng ý chia sẻ dữ liệu bất kỳ lúc nào, điều này có thể ảnh hưởng đến một số tính năng của dịch vụ.',
  },
  {
    title: '6. Cookie & Công nghệ Lưu trữ',
    body: 'Vui học Địa Lý sử dụng cookie và localStorage để: \n • Duy trì phiên đăng nhập (session token). \n • Lưu tùy chọn cài đặt cá nhân (chế độ đồ họa 3D, ngôn ngữ). \n • Cải thiện hiệu suất tải trang. \n Chúng tôi KHÔNG sử dụng cookie quảng cáo hay theo dõi hành vi người dùng qua các trang web khác. Bạn có thể xóa cookie bất kỳ lúc nào qua cài đặt trình duyệt, tuy nhiên điều này có thể làm mất phiên đăng nhập hiện tại.',
  },
  {
    title: '7. Bảo vệ Trẻ em',
    body: 'Vui học Địa Lý được thiết kế phục vụ học sinh THCS (khoảng 11–15 tuổi). Chúng tôi đặc biệt coi trọng việc bảo vệ dữ liệu cá nhân của người dùng dưới 18 tuổi. \n Đối với học sinh dưới 15 tuổi, nhà trường hoặc cha mẹ/người giám hộ được khuyến nghị xem xét và đồng ý với chính sách này thay mặt cho học sinh. Giáo viên quản lý lớp học có trách nhiệm đảm bảo học sinh sử dụng nền tảng đúng mục đích. \n Nếu phát hiện chúng tôi vô tình thu thập thông tin cá nhân của trẻ em mà không có sự đồng ý hợp lệ, vui lòng liên hệ ngay để chúng tôi xóa thông tin đó trong vòng 72 giờ.',
  },
  {
    title: '8. Cập nhật Chính sách',
    body: 'Chính sách này có thể được cập nhật định kỳ để phản ánh thay đổi trong hoạt động, yêu cầu pháp lý hoặc cải tiến bảo mật. Ngày cập nhật lần cuối luôn được hiển thị rõ ràng ở đầu trang. \n Các thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo nổi bật trên nền tảng ít nhất 7 ngày trước khi có hiệu lực. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận chính sách mới.',
  },
];

// ── Reusable Accordion ────────────────────────────────────────────────────────

function Accordion({ sections }: { sections: { title: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-cyan-50 transition-colors text-left gap-2"
          >
            <span className="text-sm font-bold text-[#082F49]">{s.title}</span>
            <span className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${open === i ? 'rotate-180' : ''}`}>
              <Icon icon="material-symbols:keyboard-arrow-down-rounded" width={20} />
            </span>
          </button>
          {open === i && (
            <div className="px-4 py-3 bg-white">
              <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { q: 'Làm sao để có thêm EXP?', a: 'Hoàn thành các bài Quiz trong Đấu trường, học bài giảng mỗi ngày, và duy trì chuỗi ngày học (streak). Mỗi ngày học đều đặn sẽ nhận thưởng EXP bonus.' },
  { q: 'Xu (Coins) dùng để làm gì?', a: 'Xu dùng để mua thức ăn cho Thú cưng trong Pet Garden, và trong tương lai sẽ mở thêm tính năng tùy chỉnh giao diện, huy hiệu đặc biệt.' },
  { q: 'Làm sao để vào lớp học?', a: 'Bạn cần Mã lớp học từ giáo viên. Vào mục Lớp học → nhập mã → nhấn Tham gia. Giáo viên phải tạo lớp và chia sẻ mã cho học sinh.' },
  { q: 'Tôi có thể đổi Avatar không?', a: 'Có! Vào Hồ sơ cá nhân (biểu tượng tên ở góc trên phải) → nhấn Chỉnh sửa Hồ sơ → nhấn vào ảnh đại diện để tải ảnh mới lên.' },
  { q: 'Tại sao điểm EXP của tôi không tăng?', a: 'Kiểm tra: (1) Bạn đã đăng nhập chưa? (2) Quiz phải hoàn thành toàn bộ mới tính điểm. (3) Mỗi bộ Quiz chỉ tính điểm lần đầu tiên.' },
  { q: 'Thú cưng cấp độ bao nhiêu là cao nhất?', a: 'Hiện tại thú cưng có nhiều cấp độ, cấp càng cao thú cưng càng to và đẹp hơn. Cho thú cưng ăn thường xuyên để tăng EXP Pet nhanh.' },
  { q: 'Bảng xếp hạng cập nhật khi nào?', a: 'Bảng xếp hạng được cập nhật theo thời gian thực. Thứ hạng thay đổi ngay sau khi bạn hoàn thành Quiz hoặc được thầy cô cộng điểm.' },
  { q: 'Tôi có thể học offline không?', a: 'Một số nội dung được cache để xem offline (PWA). Tuy nhiên Quiz, Đấu trường và tính năng realtime yêu cầu kết nối internet.' },
  { q: 'Làm sao để xem lại bài học?', a: 'Vào mục Sách → chọn bài giảng bạn muốn xem lại. Tất cả bài giảng đều có thể xem lại không giới hạn.' },
  { q: 'Tôi quên mật khẩu thì phải làm gì?', a: 'Liên hệ giáo viên hoặc gửi email đến admin để được đặt lại mật khẩu. Tính năng tự đặt lại qua email sẽ sớm được bổ sung.' },
  { q: 'Có thể dùng trên điện thoại không?', a: 'Hoàn toàn có! Trang web tối ưu cho mobile. Bạn còn có thể cài lên màn hình chính điện thoại như một ứng dụng (PWA) để trải nghiệm tốt hơn.' },
  { q: 'Dữ liệu học tập của tôi có bị mất không?', a: 'Không! Toàn bộ dữ liệu được lưu trên máy chủ và sao lưu định kỳ. Bạn có thể đăng nhập từ bất kỳ thiết bị nào và tiếp tục học.' },
];

// ── Map Guide data ────────────────────────────────────────────────────────────

const MAP_GUIDE_SECTIONS = [
  {
    title: '🖱️ Điều khiển Cơ bản',
    body: '• Xoay bản đồ: Nhấn giữ chuột trái và kéo theo hướng muốn xoay.\n• Phóng to / Thu nhỏ: Lăn bánh cuộn chuột (scroll wheel) hoặc kéo hai ngón tay trên màn hình cảm ứng.\n• Di chuyển: Nhấn giữ chuột phải và kéo để dịch chuyển điểm nhìn.\n• Đặt lại góc nhìn: Nhấn nút Reset hoặc phím R để về vị trí mặc định.',
  },
  {
    title: '🗺️ Các Chế độ Bản đồ',
    body: '• Địa hình (Topography): Hiển thị độ cao, núi, đồng bằng và địa hình tự nhiên bằng màu sắc trực quan.\n• Khí hậu (Climate): Phân vùng khí hậu theo màu — nhiệt đới, ôn đới, hàn đới, sa mạc…\n• Kinh tế (Economic): Thể hiện mức độ phát triển kinh tế và GDP theo từng quốc gia.\n• Chính trị (Political): Hiển thị ranh giới quốc gia, thủ đô và tên quốc gia.\n• Dân số (Population): Biểu đồ mật độ dân số theo màu gradient.',
  },
  {
    title: '🔍 Tìm kiếm & Khám phá',
    body: '• Tìm kiếm quốc gia: Nhập tên quốc gia vào ô tìm kiếm, bản đồ sẽ tự động bay đến vị trí đó.\n• Nhấn vào quốc gia: Click vào bất kỳ quốc gia nào để xem thông tin chi tiết (dân số, diện tích, thủ đô, múi giờ…).\n• So sánh quốc gia: Chọn tối đa 3 quốc gia để so sánh các chỉ số bên cạnh nhau.\n• Lớp dữ liệu: Bật/tắt các lớp thông tin (sông ngòi, núi lửa, thành phố lớn…) qua bảng điều khiển bên phải.',
  },
  {
    title: '📏 Đo khoảng cách & Diện tích',
    body: '• Đo khoảng cách: Chọn công cụ Đo lường → click điểm đầu → click điểm cuối → khoảng cách hiển thị theo km hoặc dặm.\n• Đo diện tích: Vẽ vùng bằng cách click nhiều điểm → kéo khép vùng → diện tích tự tính.\n• Đổi đơn vị: Chuyển đổi giữa km/dặm trong Cài đặt → Hệ đo lường.',
  },
  {
    title: '🎮 Chế độ Học tập trên Bản đồ',
    body: '• Đoán vị trí: Hệ thống cho một tên quốc gia/thành phố, bạn cần click đúng vị trí trên bản đồ. Càng chính xác càng được nhiều điểm.\n• Quiz Bản đồ: Trả lời câu hỏi về địa lý ngay trên giao diện bản đồ tương tác.\n• Khám phá tự do: Không có giới hạn thời gian, tự do khám phá và tìm hiểu thông tin.',
  },
  {
    title: '⚙️ Cài đặt Đồ họa',
    body: '• Chế độ Mượt mà: Tắt hiệu ứng khí quyển và mây động — phù hợp máy tính cấu hình thấp.\n• Chế độ Cực độ: Bật toàn bộ hiệu ứng (mây 3D, ánh sáng mặt trời, bóng đổ thực tế) — cần GPU tốt.\n• Thay đổi trong Cài đặt (biểu tượng bánh răng) → Hiệu Năng 3D.',
  },
];

// ── Contact Form ──────────────────────────────────────────────────────────────

function ContactForm({ username }: { username: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (content.trim().length < 5) { setErrMsg('Vui lòng nhập nội dung (tối thiểu 5 ký tự)'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), image: image || undefined }),
      });
      if (res.ok) { setStatus('ok'); setContent(''); setImage(null); }
      else { const d = await res.json() as { error?: string }; setErrMsg(d.error ?? 'Gửi thất bại'); setStatus('err'); }
    } catch { setErrMsg('Lỗi kết nối, thử lại sau'); setStatus('err'); }
  };

  if (status === 'ok') return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-4xl">✅</span>
      <p className="font-black text-green-600 text-base">Gửi thành công!</p>
      <p className="text-xs text-slate-500">Ban quản trị sẽ phản hồi sớm nhất có thể.</p>
      <button onClick={() => setStatus('idle')} className="mt-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors">Gửi thêm</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tên */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Người gửi</label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-100 border border-slate-200">
          <Icon icon="mingcute:user-3-fill" width={18} className="text-cyan-500" />
          <span className="text-sm font-bold text-[#082F49]">{username}</span>
        </div>
      </div>

      {/* Ảnh */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Ảnh đính kèm <span className="text-slate-400 font-normal">(tùy chọn)</span></label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        {image ? (
          <div className="relative inline-block">
            <img src={image} alt="preview" className="w-32 h-32 rounded-2xl object-cover border-2 border-cyan-200" />
            <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow">✕</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50 transition-all text-sm text-slate-500 font-medium">
            <Icon icon="material-symbols:add-photo-alternate-outline-rounded" width={20} />
            Chọn ảnh
          </button>
        )}
      </div>

      {/* Nội dung */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1.5">Nội dung <span className="text-red-400">*</span></label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Mô tả vấn đề bạn gặp phải, góp ý hoặc câu hỏi cần hỗ trợ..."
          className="w-full px-4 py-3 rounded-2xl text-sm text-[#082F49] placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none transition-all"
        />
      </div>

      {errMsg && <p className="text-xs text-red-500 font-medium">{errMsg}</p>}

      <button
        onClick={handleSubmit}
        disabled={status === 'sending'}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm shadow-md hover:shadow-cyan-300/40 disabled:opacity-60 transition-all"
      >
        {status === 'sending' ? 'Đang gửi...' : '📨 Gửi liên hệ'}
      </button>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalKey = 'faq' | 'guide' | 'contact' | 'terms' | 'privacy';

// ── Footer ────────────────────────────────────────────────────────────────────

export function Footer() {
  const { data: session } = useSession();
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const close = () => setActiveModal(null);

  const MODAL_TITLES: Record<ModalKey, string> = {
    faq: '❓ Câu hỏi thường gặp (FAQ)',
    guide: '🗺️ Hướng dẫn sử dụng Bản đồ',
    contact: '💬 Liên hệ Ban Giám Hiệu',
    terms: '📜 Điều khoản Dịch vụ',
    privacy: '🛡️ Chính sách Quyền riêng tư',
  };

  const isWide = activeModal === 'terms' || activeModal === 'privacy' || activeModal === 'faq' || activeModal === 'guide';

  return (
    <>
      <footer className="relative mt-20 border-t border-white/60 bg-white/40 backdrop-blur-xl">
        {/* Wave decoration */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-[99%]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[50px] fill-white/40">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.45,130.85,121.26,193.3,109.86,238.16,101.62,282.89,75.44,321.39,56.44Z" />
          </svg>
        </div>

        <div className="w-[95%] md:w-[90%] max-w-7xl mx-auto py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">

            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-3 group mb-4">
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-105 group-hover:rotate-6 transition-transform">
                  <FaMapMarkedAlt />
                </div>
                <div>
                  <p className="font-black text-[#082F49] text-2xl leading-none tracking-tight">Vui học Địa Lý</p>
                  <p className="text-xs text-cyan-600 font-bold tracking-[0.15em] uppercase mt-1">Học Địa Lý Vui Nhộn</p>
                </div>
              </Link>
              <p className="text-[#334155] text-sm leading-relaxed max-w-sm mb-6">
                Nền tảng học hỏi, khám phá và chinh phục thế giới dành cho học sinh THCS.
                Cùng nhau đi khắp năm châu bốn bể ngay trên màn hình của bạn!
              </p>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-blue-50 transition-all text-lg"><FaFacebook /></a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-red-50 transition-all text-lg"><FaYoutube /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-slate-50 transition-all text-lg"><FaGithub /></a>
              </div>
            </div>

            {/* Khám phá */}
            <div>
              <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Khám phá</h4>
              <ul className="space-y-3">
                <li><Link href="/map" className="flex items-center text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors"><Icon icon="material-symbols:map-rounded" width={22} />&nbsp; Bản đồ Tương tác</Link></li>
                <li><Link href="/arena" className="flex items-center text-sm font-bold text-[#334155] hover:text-rose-500 transition-colors"><Icon icon="material-symbols:toys-and-games" width={22} />&nbsp; Đấu trường Trí tuệ</Link></li>
                <li><Link href="/roadmap" className="flex items-center text-sm font-bold text-[#334155] hover:text-emerald-500 transition-colors"><Icon icon="material-symbols:timeline" width={22} />&nbsp; Lộ trình Khám phá</Link></li>
                <li><Link href="/classroom" className="flex items-center text-sm font-bold text-[#334155] hover:text-blue-500 transition-colors"><Icon icon="material-symbols:home-work-rounded" width={22} />&nbsp; Lớp học Ảo</Link></li>
              </ul>
            </div>

            {/* Hỗ trợ */}
            <div>
              <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Hỗ trợ</h4>
              <ul className="space-y-3">
                <li><button onClick={() => setActiveModal('faq')} className="flex items-center text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors"><Icon icon="mingcute:question-2-fill" width={22} />&nbsp; Câu hỏi thường gặp</button></li>
                <li><button onClick={() => setActiveModal('guide')} className="flex items-center text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors"><Icon icon="mingcute:document-3-fill" width={22} />&nbsp; Hướng dẫn sử dụng</button></li>
                <li><button onClick={() => setActiveModal('contact')} className="flex items-center text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors"><Icon icon="mingcute:message-1-ai-fill" width={22} />&nbsp; Liên hệ Ban Giám Hiệu</button></li>
                <li><Link href="/profile" className="flex items-center text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors"><Icon icon="mingcute:user-edit-fill" width={22} />&nbsp; Quản lý Tài khoản</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="flex items-center text-xs font-bold text-[#94A3B8]">
              © {new Date().getFullYear()} Vui học Địa Lý. Thiết kế bởi YuuBee &nbsp;<Icon icon="mingcute:heart-fill" width={16} />
            </p>
            <div className="flex items-center gap-4 text-xs font-bold tracking-wide text-[#94A3B8]">
              <button onClick={() => setActiveModal('terms')} className="hover:text-cyan-600 transition-colors cursor-pointer">Điều khoản dịch vụ</button>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-600 transition-colors cursor-pointer">Chính sách quyền riêng tư</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white/95 backdrop-blur-3xl border border-white max-w-lg w-full rounded-3xl shadow-[0_30px_60px_rgba(8,47,73,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300"
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header — giữ nguyên style cũ */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
              <h3 className="text-lg font-black text-[#082F49]">{MODAL_TITLES[activeModal]}</h3>
              <button
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeModal === 'faq' && <Accordion sections={FAQ_ITEMS.map(f => ({ title: f.q, body: f.a }))} />}
              {activeModal === 'guide' && <Accordion sections={MAP_GUIDE_SECTIONS} />}
              {activeModal === 'contact' && <ContactForm username={session?.user?.name ?? 'Khách'} />}
              {(activeModal === 'terms' || activeModal === 'privacy') && (
                <Accordion sections={activeModal === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS} />
              )}
            </div>

            {/* Footer — giữ nguyên style cũ */}
            {activeModal !== 'contact' && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
                <button onClick={close} className="px-6 py-2 rounded-xl bg-[#082F49] text-white font-bold text-sm shadow-md hover:bg-cyan-600 transition-colors">
                  Đã hiểu
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
