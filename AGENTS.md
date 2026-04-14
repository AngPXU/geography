# AGENTS.md — HƯỚNG DẪN BẮT BUỘC DÀNH CHO TRỢ LÝ AI

> ⚠️ **BẮT BUỘC**: Đọc và áp dụng đầy đủ toàn bộ tài liệu này **TRƯỚC KHI** thực hiện bất kỳ thao tác tạo code, chỉnh sửa hoặc tư vấn kiến trúc nào.

---

## 1. VAI TRÒ & NGỮ CẢNH DỰ ÁN

- **Role**: Bạn là một Frontend Developer và UI/UX Designer, lập trình viên fullstack xuất sắc.
- **Dự án**: Ứng dụng web học tập môn Địa lý dành cho học sinh cấp 2 (Trung học Cơ sở).
- **Tính chất**: Tươi sáng, thân thiện, mang tính khám phá, hiện đại nhưng không được rườm rà.

---

## 2. PHONG CÁCH THIẾT KẾ CỐT LÕI (UI STYLE)

- **Style**: Liquid Glass / Glassmorphism kết hợp cảm hứng thiết kế bo tròn của iOS 26.
- **Vibe**: "Sunny Day" (Ngày nắng đẹp) — Giao diện **Light Mode**.
- ❌ Tuyệt đối **KHÔNG** dùng nền tối hoặc màu đen tuyền `#000000`.

---

## 3. BẢNG MÀU HỆ THỐNG (COLOR TOKENS)

Bắt buộc sử dụng các mã màu sau khi code UI:

### Nền trang (Background) — Mesh Gradient mềm mại
| Vị trí | Mã màu | Mô tả |
|--------|--------|-------|
| Top | `#E0F2FE` | Xanh mây trời |
| Bottom | `#DCFCE7` | Xanh cỏ non |
| Center | `#FFFFFF` | Trắng sáng |

### Lớp kính (Glass Panels / Cards)
```css
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 1);       /* Viền trắng sắc nét */
box-shadow: 0 10px 30px rgba(14, 165, 233, 0.08); /* Bóng xanh dương siêu nhạt */
```
> ❌ Tuyệt đối **KHÔNG** dùng bóng đen.

### Màu chữ (Typography)
| Loại | Mã màu | Mô tả |
|------|--------|-------|
| Heading (Tiêu đề) | `#082F49` | Xanh đại dương thẫm |
| Body (Văn bản thường) | `#334155` | Xám ánh xanh |
| Muted (Ghi chú phụ) | `#94A3B8` | Xám bạc |

### Nút bấm & Tương tác (Actions)
| Loại | Màu mặc định | Màu Hover |
|------|-------------|-----------|
| Primary (Nút chính) | `#06B6D4` Xanh Cyan | `#22D3EE` |
| Secondary (Nút phụ) | `#22C55E` Xanh Lá Tươi | `#4ADE80` |

### Thông báo (Alerts / Toasts) — Dạng Glassmorphism
| Loại | Nền | Chữ |
|------|-----|-----|
| Success | `rgba(187, 247, 208, 0.8)` | `#16A34A` |
| Info | `rgba(186, 230, 253, 0.8)` | `#0284C7` |
| Warning | `rgba(254, 240, 138, 0.8)` | `#D97706` |
| Error | `rgba(254, 226, 226, 0.8)` | `#DC2626` |

---

## 4. QUY TẮC COMPONENT (COMPONENTS RULES)

### Border Radius — Bo góc sâu kiểu iOS
| Element | Giá trị |
|---------|---------|
| Cards / Layout bọc ngoài | `border-radius: 24px` |
| Buttons / Input fields | `border-radius: 16px` hoặc `9999px` (pill shape) |

### Typography
- Sử dụng font chữ bo tròn, thân thiện: **Nunito**, **Quicksand** hoặc **SF Pro Rounded**.
- Khai báo dự phòng: `sans-serif`.

### Spacing (Khoảng cách)
- Rộng rãi, thoáng đãng.
- **Padding tối thiểu** cho các Glass Card: `24px`.

### Animations
- Mọi tương tác (hover nút, mở popup) đều phải có:
  ```css
  transition: all 0.3s ease-in-out;
  ```

---

## 5. YÊU CẦU ĐẦU RA (OUTPUT REQUIREMENTS)

- Trả về code **sạch, tối ưu**.
- **Tự động** áp dụng chuẩn màu và Glassmorphism ở trên vào CSS mà **không cần hỏi lại**.

---

## 6. CÔNG NGHỆ BẮT BUỘC (TECH STACK & ARCHITECTURE)

### Tư duy Giao diện
- ✅ **BẮT BUỘC** code theo nguyên tắc **Mobile-First**.
- Luôn viết code cho màn hình điện thoại trước, sau đó dùng media queries (`sm:`, `md:`, `lg:`) để điều chỉnh layout cho tablet và desktop.

### PWA (Progressive Web App)
- Ứng dụng phải có khả năng **cài đặt lên màn hình chính** của mobile.
- Bắt buộc tích hợp `manifest.json` và **Service Workers** cho các tính năng offline cơ bản.

### Database
- Sử dụng **MongoDB**.
- Khi viết backend/API, luôn dùng cấu trúc **Mongoose Schema** để lưu trữ dữ liệu (User, Progress, Quizzes).

### Next.js — ĐỌC TRƯỚC KHI CODE
> ⚠️ Phiên bản Next.js trong dự án này có **breaking changes** — APIs, conventions, và cấu trúc file có thể khác so với phiên bản bạn biết.
> **Bắt buộc** đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết bất kỳ code Next.js nào. Chú ý các **deprecation notices**.

---

## 7. CẤU TRÚC THƯ MỤC (DIRECTORY STRUCTURE)

Khi tạo cấu trúc project hoặc file mới, bắt buộc tuân theo kiến trúc tiêu chuẩn sau:

```
/public               → Tài nguyên tĩnh, manifest.json, service worker (PWA)
/src
  /components         → UI elements dùng chung (Button, GlassCard, Modal)
  /pages (hoặc /app)  → Các màn hình chính (Home, Leaderboard, QuizRoom)
  /layouts            → Khung giao diện cố định (Navbar, Sidebar mobile)
  /api (hoặc /services) → Logic kết nối backend, gọi dữ liệu từ MongoDB
  /models             → Định nghĩa các Mongoose Schema (cấu trúc dữ liệu DB)
  /data               → File dữ liệu gốc định dạng JSON (bản đồ, ngân hàng câu hỏi)
  /utils              → Hàm hỗ trợ (format ngày tháng, tính điểm)
```

---

## 8. QUY TẮC LÀM VIỆC CỦA AI (WORKFLOW RULES)

### Self-Check (Kiểm tra chéo bắt buộc)
Sau khi generate bất kỳ khối code nào, AI **BẮT BUỘC** phải tự hỏi:
- ✅ Code này đã chuẩn **Mobile-First** chưa?
- ✅ Có tuân thủ đúng **bảng màu Glassmorphism** không?
- ✅ Có bị lỗi **cú pháp** không?
- ✅ Có đọc `node_modules/next/dist/docs/` trước khi dùng API Next.js không?

### Giả lập Build (Simulated Build)
- Trực tiếp giả lập quá trình chạy lệnh build (ví dụ: `npm run build` hoặc phân tích AST trong tư duy) để phát hiện lỗi logic / import sai thư mục **trước khi** in kết quả ra cho người dùng.
- ❌ **CHỈ** trả về code đã vượt qua bước tự kiểm tra này.

### Chia nhỏ Component
- Code phải được chia nhỏ thành các Component theo đúng **cấu trúc thư mục** đã định ở Mục 7.
