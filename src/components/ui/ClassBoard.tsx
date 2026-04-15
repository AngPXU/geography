'use client';

import { useState } from 'react';
import { FaBook, FaPlus, FaPaperclip, FaCheckCircle, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface Post {
  id: number;
  type: 'announcement' | 'assignment' | 'material';
  title: string;
  body: string;
  deadline?: string;
  attachments?: string[];
  createdAt: string;
  submissions?: number;
  total?: number;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    type: 'assignment',
    title: 'Bài tập: Vẽ sơ đồ tư duy các vùng kinh tế Việt Nam',
    body: 'Các em vẽ sơ đồ tư duy tổng kết 7 vùng kinh tế theo đúng mẫu đã học. Chú ý ghi rõ đặc trưng nổi bật mỗi vùng.',
    deadline: '2026-04-20',
    createdAt: '15/04/2026',
    submissions: 18,
    total: 32,
  },
  {
    id: 2,
    type: 'material',
    title: 'Tài liệu: Slide bài 12 — Dân số Việt Nam',
    body: 'Slide tổng hợp bài 12 về cơ cấu, phân bố và các vấn đề dân số của Việt Nam. Đọc kỹ trước buổi học thứ Tư nhé.',
    attachments: ['Slide_Bai12_DanSo.pdf', 'Atlat_DanSo.jpg'],
    createdAt: '14/04/2026',
  },
  {
    id: 3,
    type: 'announcement',
    title: '📢 Thông báo: Kiểm tra 15 phút thứ Sáu tuần này',
    body: 'Kiểm tra 15 phút vào đầu tiết học thứ Sáu, nội dung từ bài 10 đến bài 14. Các em ôn tập kỹ nhé!',
    createdAt: '13/04/2026',
  },
];

const TYPE_CONFIG = {
  assignment: { label: 'Bài tập', icon: '📝', bg: 'bg-orange-50', border: 'border-orange-200', chip: 'bg-orange-100 text-orange-700' },
  material: { label: 'Tài liệu', icon: '📎', bg: 'bg-blue-50', border: 'border-blue-200', chip: 'bg-blue-100 text-blue-700' },
  announcement: { label: 'Thông báo', icon: '📢', bg: 'bg-amber-50', border: 'border-amber-200', chip: 'bg-amber-100 text-amber-700' },
};

export function ClassBoard() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [form, setForm] = useState({ type: 'announcement' as Post['type'], title: '', body: '', deadline: '' });

  const handleCreate = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      type: form.type,
      title: form.title,
      body: form.body,
      deadline: form.deadline || undefined,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      submissions: form.type === 'assignment' ? 0 : undefined,
      total: form.type === 'assignment' ? 32 : undefined,
    };
    setPosts(p => [newPost, ...p]);
    setForm({ type: 'announcement', title: '', body: '', deadline: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <FaBook />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#082F49]">Bảng thông báo lớp</h2>
            <p className="text-sm text-[#94A3B8]">Đăng bài tập, tài liệu và thông báo cho học sinh</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm shadow-[0_8px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_28px_rgba(139,92,246,0.45)] hover:-translate-y-0.5 transition-all"
        >
          <FaPlus /> Đăng mới
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_40px_rgba(139,92,246,0.12)] space-y-4">
          <h3 className="font-extrabold text-[#082F49]">Tạo bài đăng mới</h3>

          <div className="flex gap-2">
            {(['announcement', 'assignment', 'material'] as Post['type'][]).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${form.type === t ? TYPE_CONFIG[t].chip + ' ring-2 ring-offset-1 ring-violet-300' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Tiêu đề..."
            className="w-full p-3 rounded-[14px] border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 text-sm font-medium transition-colors"
          />
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Nội dung chi tiết..."
            rows={3}
            className="w-full p-3 rounded-[14px] border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 text-sm resize-none transition-colors"
          />
          {form.type === 'assignment' && (
            <div className="flex items-center gap-2">
              <FaClock className="text-slate-400 text-sm" />
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="p-2.5 rounded-[12px] border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 text-sm transition-colors"
              />
              <span className="text-xs text-[#94A3B8]">Deadline nộp bài</span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-full text-sm text-slate-400 hover:bg-slate-100 font-semibold transition-colors">Huỷ</button>
            <button
              onClick={handleCreate}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Đăng
            </button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {posts.map(post => {
          const cfg = TYPE_CONFIG[post.type];
          const isOpen = expanded === post.id;
          return (
            <div key={post.id} className={`bg-white/80 backdrop-blur-xl border rounded-[24px] shadow-[0_8px_24px_rgba(14,165,233,0.06)] overflow-hidden transition-all duration-300 ${cfg.border}`}>
              <button
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/60 transition-colors"
                onClick={() => setExpanded(isOpen ? null : post.id)}
              >
                <span className="text-2xl mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.chip}`}>{cfg.label}</span>
                    <span className="text-xs text-[#94A3B8]">{post.createdAt}</span>
                    {post.deadline && (
                      <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                        <FaClock className="text-[10px]" /> Hạn: {new Date(post.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <p className="font-extrabold text-[#082F49] text-sm leading-snug">{post.title}</p>
                  {post.type === 'assignment' && post.submissions !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"
                          style={{ width: `${((post.submissions ?? 0) / (post.total ?? 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#94A3B8] font-medium">{post.submissions}/{post.total} đã nộp</span>
                    </div>
                  )}
                </div>
                <span className="text-slate-300 mt-1">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
              </button>

              {isOpen && (
                <div className={`px-5 pb-5 space-y-4 ${cfg.bg} border-t ${cfg.border}`}>
                  <p className="text-sm text-[#334155] leading-relaxed pt-4">{post.body}</p>
                  {post.attachments && (
                    <div className="flex flex-wrap gap-2">
                      {post.attachments.map((a, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-[#334155] px-3 py-1.5 rounded-full font-medium hover:bg-slate-50 cursor-pointer transition-colors">
                          <FaPaperclip className="text-violet-400" /> {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {post.type === 'assignment' && (
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-[14px] border border-white">
                      <div className="flex items-center gap-2 text-sm text-[#334155]">
                        <FaCheckCircle className="text-emerald-400" />
                        <span className="font-semibold">{post.submissions}/{post.total} học sinh đã nộp bài</span>
                      </div>
                      <button className="text-xs bg-violet-100 text-violet-700 font-bold px-4 py-1.5 rounded-full hover:bg-violet-200 transition-colors">
                        Xem bài nộp
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
