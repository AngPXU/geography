'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PresentationBuilderClient } from './PresentationBuilderClient';

export function PresentationManagerClient() {
  const [activeGrade, setActiveGrade] = useState<number>(6); // Default to 6
  const [presentations, setPresentations] = useState<any[]>([]);
  const [activePresentationId, setActivePresentationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // For horizontal scroll buttons if needed, or just use overflow-x-auto
  const scrollRef = useRef<HTMLDivElement>(null);

  const getGradeCardStyle = (grade: number) => {
    switch (grade) {
      case 6: return 'border-cyan-200 hover:border-cyan-400 shadow-[0_10px_30px_rgba(6,182,212,0.1)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.2)]';
      case 7: return 'border-emerald-200 hover:border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.1)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]';
      case 8: return 'border-amber-200 hover:border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.1)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.2)]';
      case 9: return 'border-fuchsia-200 hover:border-fuchsia-400 shadow-[0_10px_30px_rgba(217,70,239,0.1)] hover:shadow-[0_20px_40px_rgba(217,70,239,0.2)]';
      default: return 'border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] hover:shadow-[0_20px_40px_rgba(14,165,233,0.12)]';
    }
  };

  const grades = [
    { id: 6, title: 'Lớp 6', icon: '🌍', color: 'from-cyan-400 to-blue-400', activeBg: 'bg-gradient-to-r from-cyan-500 to-blue-500', textColors: 'text-cyan-700' },
    { id: 7, title: 'Lớp 7', icon: '🌱', color: 'from-emerald-400 to-green-400', activeBg: 'bg-gradient-to-r from-emerald-500 to-green-500', textColors: 'text-emerald-700' },
    { id: 8, title: 'Lớp 8', icon: '🌋', color: 'from-amber-400 to-orange-400', activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500', textColors: 'text-amber-700' },
    { id: 9, title: 'Lớp 9', icon: '🏙️', color: 'from-fuchsia-400 to-purple-400', activeBg: 'bg-gradient-to-r from-fuchsia-500 to-purple-500', textColors: 'text-fuchsia-700' },
  ];

  const fetchPresentations = async (grade: number, currentSearch = search, currentSort = sort, currentPage = page) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/presentations?grade=${grade}&page=${currentPage}&limit=15&search=${encodeURIComponent(currentSearch)}&sort=${currentSort}`);
      const data = await res.json();
      if (data.presentations) {
        setPresentations(data.presentations);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeGrade) {
      fetchPresentations(activeGrade, search, sort, page);
    }
  }, [activeGrade, sort, page]);

  const handleSearch = () => {
    setPage(1);
    if (activeGrade) fetchPresentations(activeGrade, search, sort, 1);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNewTitle('Bài giảng mới');
    setShowCreateModal(true);
  };

  const handleEditTitle = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setNewTitle(title);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`/api/presentations?id=${deleteConfirmId}`, { method: 'DELETE' });
      if (activeGrade) fetchPresentations(activeGrade, search, sort, page);
    } catch (e) {
      console.error('Lỗi xóa bài giảng', e);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleConfirmCreate = async () => {
    if (!activeGrade || !newTitle.trim()) return;
    setIsCreating(true);
    try {
      const payload: any = { title: newTitle.trim(), grade: activeGrade };
      if (editingId) payload.id = editingId;
      else payload.blocks = [];

      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (!editingId) {
          setActivePresentationId(data.presentation._id);
        } else {
          if (activeGrade) fetchPresentations(activeGrade, search, sort, page);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
    } finally {
      setIsCreating(false);
      setShowCreateModal(false);
      setEditingId(null);
    }
  };

  // NẾU ĐANG CHỈNH SỬA MỘT BÀI GIẢNG -> HIỂN THỊ BUILDER
  if (activePresentationId) {
    return (
      <PresentationBuilderClient 
        presentationId={activePresentationId} 
        onBack={() => {
          setActivePresentationId(null);
          if (activeGrade) fetchPresentations(activeGrade);
        }} 
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* ── HEADER & GRADE SELECTOR (Mobile-First) ── */}
      <div className="bg-white/75 backdrop-blur-[20px] rounded-[24px] p-6 border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#082F49] tracking-tight drop-shadow-sm mb-2">
              Quản lý Bài Giảng
            </h1>
            <p className="text-[#334155] font-medium text-sm sm:text-base">
              Soạn thảo kịch bản Interactive Scrollytelling cho các khối lớp.
            </p>
          </div>
          
          <button 
            onClick={handleOpenCreateModal}
            disabled={isCreating}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#06B6D4] to-[#22C55E] text-white font-bold rounded-[16px] shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5 whitespace-nowrap"
          >
            <span className="text-xl leading-none">+</span> 
            <span>Tạo bài giảng mới</span>
          </button>
        </div>

        {/* Horizontal Grade Tabs */}
        <div className="relative w-full overflow-hidden">
          <div 
            className="flex gap-3 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            ref={scrollRef}
          >
            {grades.map(grade => {
              const isActive = activeGrade === grade.id;
              return (
                <button
                  key={grade.id}
                  onClick={() => setActiveGrade(grade.id)}
                  className={`
                    relative snap-start shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-[18px] transition-all duration-300
                    border ${isActive ? 'border-transparent shadow-md scale-100' : 'border-white bg-white/50 hover:bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5'}
                  `}
                >
                  {isActive && (
                    <div className={`absolute inset-0 ${grade.activeBg} rounded-[18px] opacity-100`}></div>
                  )}
                  
                  <div className="relative z-10 text-xl">{grade.icon}</div>
                  <span className={`relative z-10 font-bold whitespace-nowrap ${isActive ? 'text-white' : grade.textColors}`}>
                    {grade.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR (SEARCH & SORT) ── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input 
            type="text" 
            placeholder={`Tìm kiếm bài giảng Lớp ${activeGrade}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/75 backdrop-blur-[20px] pl-12 pr-5 py-3.5 rounded-[16px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.05)] focus:shadow-[0_10px_30px_rgba(14,165,233,0.1)] outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all font-medium text-[#082F49] placeholder:text-[#94A3B8]"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#06B6D4] transition-colors text-lg">
            🔍
          </span>
        </div>
        <div className="relative shrink-0">
          <select 
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto bg-white/75 backdrop-blur-[20px] pl-5 pr-10 py-3.5 rounded-[16px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.05)] outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all font-bold text-[#082F49] cursor-pointer appearance-none"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="az">Tên A-Z</option>
            <option value="za">Tên Z-A</option>
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none text-xs">
            ▼
          </span>
        </div>
      </div>

      {/* ── DANH SÁCH BÀI GIẢNG ── */}
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        {isLoading ? (
          <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-[24px] border border-white">
            <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#082F49] font-bold">Đang tải bài giảng...</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[24px] border-2 border-dashed border-white shadow-[0_10px_30px_rgba(14,165,233,0.05)]">
            <div className="text-6xl mb-6 opacity-50 drop-shadow-sm">📚</div>
            <p className="text-[#334155] font-black text-2xl mb-3">Chưa có bài giảng nào</p>
            <p className="text-[#94A3B8] font-medium mb-6">Hãy tạo kịch bản học tập tương tác đầu tiên cho Lớp {activeGrade}!</p>
            <button 
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-white hover:bg-cyan-50 text-[#06B6D4] font-bold rounded-[16px] shadow-sm border border-white transition-all hover:shadow-md"
            >
              + Tạo bài giảng ngay
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {presentations.map(pres => (
                <div key={pres._id} className={`bg-white/75 backdrop-blur-[20px] p-6 rounded-[24px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full ${getGradeCardStyle(activeGrade)}`}>
                  
                  {/* Action buttons (Edit & Delete) */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <button 
                      onClick={(e) => handleEditTitle(pres._id, pres.title, e)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-blue-500 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-colors active:scale-95"
                      title="Đổi tên"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => handleDelete(pres._id, e)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-300 shadow-sm transition-colors active:scale-95"
                      title="Xóa bài giảng"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-4 pr-16">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0284C7] rounded-[16px] flex items-center justify-center text-xl font-black shadow-inner border border-white shrink-0">
                      {pres.title.charAt(0)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-black text-[#082F49] mb-2 line-clamp-2 pr-2 leading-tight flex-1">{pres.title}</h3>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 mb-4">
                    <span className="text-sm text-[#94A3B8] font-bold flex items-center gap-1.5">
                      <span>🧱</span> {pres.blocks?.length || 0} block
                    </span>
                    <span className="text-xs font-bold text-[#94A3B8] bg-slate-50 px-2 py-1 rounded-md">
                      {new Date(pres.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setActivePresentationId(pres._id)}
                    className="w-full py-3 bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] font-bold rounded-[16px] transition-all duration-300 border border-white shadow-sm group-hover:shadow-md flex items-center justify-center gap-2"
                  >
                    Mở Trình Soạn Thảo <span>→</span>
                  </button>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md border border-white shadow-sm text-[#06B6D4] font-bold hover:bg-white hover:shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  ←
                </button>
                <span className="font-bold text-[#082F49] bg-white/80 backdrop-blur-md px-5 py-2 rounded-xl border border-white shadow-sm">
                  Trang {page} / {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md border border-white shadow-sm text-[#06B6D4] font-bold hover:bg-white hover:shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL TẠO BÀI GIẢNG MỚI ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white/80 backdrop-blur-[24px] p-8 rounded-[24px] w-full max-w-md shadow-[0_20px_60px_rgba(14,165,233,0.15)] border border-white animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-[#082F49] mb-2">{editingId ? 'Đổi tên Bài Giảng' : `Tạo Bài Giảng Lớp ${activeGrade}`}</h3>
            <p className="text-sm text-[#64748B] mb-6 font-medium">Nhập tên bài giảng. Bạn có thể thay đổi sau.</p>
            
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Bài 2: Cấu tạo của Trái Đất..."
              className="w-full bg-white/90 px-5 py-4 rounded-[16px] border border-white shadow-sm text-[#082F49] font-bold outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all duration-300 mb-6 placeholder:font-medium placeholder:text-[#94A3B8]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-3 rounded-[16px] font-bold text-[#64748B] hover:text-[#334155] hover:bg-slate-100 border border-transparent transition-all duration-300"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmCreate}
                disabled={isCreating || !newTitle.trim()}
                className="px-6 py-3 rounded-[16px] font-bold text-white bg-gradient-to-r from-[#06B6D4] to-[#0284C7] hover:from-[#22D3EE] hover:to-[#0369A1] disabled:opacity-50 transition-all duration-300 shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
              >
                {isCreating ? 'Đang lưu...' : (editingId ? 'Lưu thay đổi' : 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white/80 backdrop-blur-[24px] p-8 rounded-[24px] w-full max-w-sm shadow-[0_20px_60px_rgba(220,38,38,0.15)] border border-white animate-in zoom-in-95 duration-200 text-center">
            
            <div className="w-16 h-16 bg-red-100 border-4 border-white shadow-sm rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
              🗑️
            </div>

            <h3 className="text-2xl font-black text-[#082F49] mb-2">Xóa bài giảng?</h3>
            <p className="text-sm text-[#64748B] font-medium mb-8">
              Hành động này không thể hoàn tác. Bài giảng sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-5 py-3 rounded-[16px] font-bold text-[#334155] bg-white hover:bg-slate-50 border border-slate-200 transition-all duration-300"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-5 py-3 rounded-[16px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_12px_25px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
