'use client';

import React, { useState, useEffect } from 'react';
import { PresentationBuilderClient } from './PresentationBuilderClient';

export function PresentationManagerClient() {
  const [activeGrade, setActiveGrade] = useState<number | null>(null);
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
    { id: 6, title: 'Lớp 6', color: 'from-blue-400 to-cyan-300' },
    { id: 7, title: 'Lớp 7', color: 'from-green-400 to-emerald-300' },
    { id: 8, title: 'Lớp 8', color: 'from-orange-400 to-amber-300' },
    { id: 9, title: 'Lớp 9', color: 'from-purple-400 to-fuchsia-300' },
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
    if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này không?')) return;
    try {
      await fetch(`/api/presentations?id=${id}`, { method: 'DELETE' });
      if (activeGrade) fetchPresentations(activeGrade, search, sort, page);
    } catch (e) {
      alert('Lỗi xóa bài giảng');
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
    <div className="w-full max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── HEADER ── */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-[#082F49] tracking-tight drop-shadow-sm">
          Quản lý Kịch bản Bài Giảng
        </h1>
        <p className="text-lg text-[#334155] font-medium max-w-2xl mx-auto">
          Chọn một khối lớp bên dưới để tạo hoặc chỉnh sửa các bài giảng Interactive Scrollytelling của bạn.
        </p>
      </div>

      {/* ── THẺ KHỐI LỚP (GRADE CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {grades.map(grade => (
          <button
            key={grade.id}
            onClick={() => setActiveGrade(activeGrade === grade.id ? null : grade.id)}
            className={`relative overflow-hidden p-8 rounded-[24px] transition-all duration-300 text-left group
              ${activeGrade === grade.id 
                ? 'ring-4 ring-[#06B6D4] ring-offset-4 shadow-[0_20px_40px_rgba(6,182,212,0.2)] scale-[1.02]' 
                : 'hover:scale-105 hover:shadow-[0_20px_40px_rgba(14,165,233,0.15)] shadow-[0_10px_30px_rgba(14,165,233,0.08)] border border-white'
              }
            `}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${grade.color} opacity-80 backdrop-blur-xl transition-opacity group-hover:opacity-100`}></div>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white drop-shadow-md mb-2">{grade.title}</h2>
              <p className="text-white/90 font-bold drop-shadow-sm">
                {activeGrade === grade.id ? 'Đang mở thư mục' : 'Nhấn để mở thư mục'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ── DANH SÁCH BÀI GIẢNG ── */}
      {activeGrade && (
        <div className="bg-white/75 backdrop-blur-[20px] rounded-[24px] p-8 border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <h2 className="text-2xl font-black text-[#082F49] flex items-center gap-3">
              <span className="text-cyan-500">📚</span> 
              Danh sách bài giảng Lớp {activeGrade}
            </h2>
            
            <button 
              onClick={handleOpenCreateModal}
              disabled={isCreating}
              className="px-6 py-3 bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-bold rounded-[16px] shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <span className="text-xl">+</span> Tạo bài giảng mới
            </button>
          </div>

          {/* SEARCH & SORT TOOLBAR */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm bài giảng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white/80 backdrop-blur-md px-5 py-3 rounded-[16px] border border-white shadow-sm outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all font-medium text-[#082F49] placeholder:text-[#94A3B8]"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#06B6D4] hover:text-[#22D3EE] font-bold p-1 text-lg"
              >
                🔍
              </button>
            </div>
            <select 
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-[16px] border border-white shadow-sm outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all font-bold text-[#082F49] cursor-pointer min-w-[180px] appearance-none"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="az">Tên A-Z</option>
              <option value="za">Tên Z-A</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#94A3B8] font-bold">Đang tải dữ liệu...</p>
            </div>
          ) : presentations.length === 0 ? (
            <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-[24px] border-2 border-dashed border-white shadow-[0_10px_30px_rgba(14,165,233,0.05)]">
              <div className="text-5xl mb-4 opacity-50">📝</div>
              <p className="text-[#334155] font-bold text-xl mb-2">Chưa có bài giảng nào</p>
              <p className="text-[#94A3B8]">Hãy tạo bài giảng đầu tiên cho Lớp {activeGrade} nhé!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {presentations.map(pres => (
                  <div key={pres._id} className={`bg-white/75 backdrop-blur-[20px] p-6 rounded-[24px] border hover:-translate-y-1 transition-all duration-300 group relative ${getGradeCardStyle(activeGrade)}`}>
                    
                    {/* Action buttons (Edit & Delete) */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <button 
                        onClick={(e) => handleEditTitle(pres._id, pres.title, e)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-blue-500 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-colors"
                        title="Đổi tên"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => handleDelete(pres._id, e)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-300 shadow-sm transition-colors"
                        title="Xóa bài giảng"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="flex items-start justify-between mb-4 pr-20">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] text-[#0284C7] rounded-[16px] flex items-center justify-center text-xl font-black shadow-inner border border-white shrink-0">
                        {pres.title.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-[#94A3B8] bg-white/80 border border-white shadow-sm px-3 py-1 rounded-full whitespace-nowrap mt-2">
                        {new Date(pres.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-black text-[#082F49] mb-2 line-clamp-2 pr-2 leading-tight">{pres.title}</h3>
                    <p className="text-sm text-[#94A3B8] font-medium mb-6">
                      {pres.blocks?.length || 0} khối nội dung
                    </p>
                    
                    <button 
                      onClick={() => setActivePresentationId(pres._id)}
                      className="w-full py-3 bg-[#E0F2FE]/50 hover:bg-[#E0F2FE] text-[#0284C7] font-bold rounded-[16px] transition-all duration-300 border border-white shadow-sm group-hover:shadow-md"
                    >
                      Mở Trình Soạn Thảo →
                    </button>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/50">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-white shadow-sm text-[#06B6D4] font-bold hover:bg-[#E0F2FE] hover:shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    ←
                  </button>
                  <span className="font-bold text-[#082F49] bg-white/50 px-4 py-2 rounded-xl border border-white shadow-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-white shadow-sm text-[#06B6D4] font-bold hover:bg-[#E0F2FE] hover:shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODAL TẠO BÀI GIẢNG MỚI ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white/75 backdrop-blur-[20px] p-8 rounded-[24px] w-full max-w-md shadow-[0_20px_50px_rgba(14,165,233,0.15)] border border-white animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-[#082F49] mb-2">{editingId ? 'Đổi tên Bài Giảng' : 'Tạo Bài Giảng Mới'}</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Nhập tên bài giảng cho Lớp {activeGrade}. Bạn có thể đổi tên sau.</p>
            
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Bài 2: Cấu tạo của Trái Đất..."
              className="w-full bg-white/80 px-4 py-3 rounded-[16px] border border-white shadow-sm text-[#082F49] font-bold outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/20 transition-all duration-300 mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 rounded-[16px] font-bold text-[#94A3B8] hover:text-[#334155] hover:bg-white/80 border border-transparent hover:border-white hover:shadow-sm transition-all duration-300"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmCreate}
                disabled={isCreating || !newTitle.trim()}
                className="px-6 py-2.5 rounded-[16px] font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] disabled:opacity-50 transition-all duration-300 shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_25px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
              >
                {isCreating ? 'Đang lưu...' : (editingId ? 'Lưu thay đổi' : 'Xác nhận tạo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
