'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaPlus, FaTrash, FaPlay, FaArrowRight, FaArrowLeft, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

interface IOldLessonQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

interface IOldLessonCheck {
  _id: string;
  title: string;
  classId?: string;
  questions: IOldLessonQuestion[];
  createdAt: string;
}

interface Props {
  user: {
    id?: string;
    name?: string | null;
    role?: number;
  };
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateCheckModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<{ _id: string, name: string }[]>([]);
  const [questions, setQuestions] = useState<IOldLessonQuestion[]>([
    { text: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/homeclass')
      .then(r => r.json())
      .then(d => {
        if (d.classes) setClasses(d.classes);
      })
      .catch(e => console.error(e));
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof IOldLessonQuestion, value: any) => {
    const newQs = [...questions];
    (newQs[index] as any)[field] = value;
    setQuestions(newQs);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[optIndex] = value;
    setQuestions(newQs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tên bài kiểm tra'); return; }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) { setError(`Câu hỏi ${i + 1} không được để trống`); return; }
      if (questions[i].options.some(opt => !opt.trim())) { setError(`Vui lòng điền đủ 4 đáp án cho câu ${i + 1}`); return; }
    }

    setLoading(true); setError('');
    const payload: any = { title, questions };
    if (classId) payload.classId = classId;

    const res = await fetch('/api/classroom/old-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Tạo thất bại');
      return;
    }
    onSuccess();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inputCls = 'w-full px-4 py-2.5 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8] bg-white/80 border border-[#BAE6FD] focus:outline-none focus:border-[#06B6D4] transition-all';

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(8,47,73,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] p-7 shadow-2xl"
        style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 1)' }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-[#082F49] flex items-center gap-2">
            <span className="text-2xl">📝</span> Tạo bài kiểm tra miệng
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-red-500 transition"><FaTimes size={20} /></button>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 bg-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#334155] mb-2 ml-1">Tên bài kiểm tra <span className="text-cyan-500">*</span></label>
              <input placeholder="VD: Kiểm tra bài cũ Bài 5 - Lớp 8A..." value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#334155] mb-2 ml-1">Lớp học (Tùy chọn)</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className={inputCls}>
                <option value="">-- Không chọn lớp --</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-[#334155] ml-1">Danh sách câu hỏi</label>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-5 rounded-3xl bg-white/50 border border-sky-100 relative">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-[#06B6D4]">Câu {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="text-red-400 hover:text-red-600 text-xs font-bold">Xoá câu này</button>
                  )}
                </div>
                <input placeholder="Nội dung câu hỏi..." value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} className={inputCls + ' mb-3'} />

                <div>
                  <label className="block text-sm font-bold text-[#082F49] mb-2 mt-1">Đáp án (nhấn chữ cái để chọn đáp án đúng) *</label>
                  <div className="space-y-3">
                    {q.options.map((opt, oIndex) => {
                      const lbl = ['A', 'B', 'C', 'D'][oIndex];
                      const isCorrect = q.correctIndex === oIndex;
                      return (
                        <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-[20px] border-2 transition-all ${isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                          <button type="button" onClick={() => handleQuestionChange(qIndex, 'correctIndex', oIndex)}
                            className={`w-10 h-10 rounded-full flex justify-center items-center font-black text-sm shrink-0 transition-colors
                              ${isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                            {lbl}
                          </button>
                          <input value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} required
                            className="flex-1 px-3 py-2 rounded-full border-none bg-transparent font-semibold text-[#082F49] outline-none"
                            placeholder={`Nội dung đáp án ${lbl}...`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={handleAddQuestion} className="w-full py-3 rounded-2xl border-2 border-dashed border-[#06B6D4] text-[#06B6D4] font-bold hover:bg-cyan-50 transition">
              + Thêm câu hỏi
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full font-bold text-[#94A3B8] bg-white hover:bg-slate-50 transition">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-full font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] disabled:opacity-60 transition shadow-[0_10px_20px_rgba(6,182,212,0.3)]">
              {loading ? 'Đang tạo...' : 'Lưu bộ câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─── Presenter (Slideshow) Component ──────────────────────────────────────────
function PresenterMode({ check, onClose }: { check: IOldLessonCheck; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const question = check.questions[currentIndex];
  const isLast = currentIndex === check.questions.length - 1;
  const isFirst = currentIndex === 0;

  const handleSelectOption = (index: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const nextQuestion = () => {
    if (isLast) {
      setIsFinished(true);
    } else {
      setCurrentIndex(curr => curr + 1);
    }
  };

  const prevQuestion = () => {
    if (!isFirst) {
      setCurrentIndex(curr => curr - 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isFinished) {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (selectedAnswers[currentIndex] === undefined) {
        setSelectedAnswers(prev => ({ ...prev, [currentIndex]: -1 }));
      } else {
        nextQuestion();
      }
    } else if (e.key === 'ArrowLeft') {
      prevQuestion();
    } else if (e.key === 'Escape') {
      onClose();
    } else {
      const keyMap: Record<string, number> = { 'a': 0, 'A': 0, 'b': 1, 'B': 1, 'c': 2, 'C': 2, 'd': 3, 'D': 3 };
      if (keyMap[e.key] !== undefined) {
        handleSelectOption(keyMap[e.key]);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const correctCount = check.questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  const score = Math.round((correctCount / check.questions.length) * 10);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-8 select-none"
      style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #DCFCE7 100%)' }}>

      {/* Header */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10">
        <h1 className="text-2xl font-black text-[#082F49] drop-shadow-sm">{check.title}</h1>
        <button onClick={onClose} className="px-6 py-2 rounded-full bg-white/50 hover:bg-white text-slate-600 font-bold backdrop-blur-md transition shadow-sm flex items-center gap-2">
          <FaTimes /> Đóng trình chiếu
        </button>
      </div>

      {isFinished ? (
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-[30px] border-2 border-white rounded-[40px] shadow-[0_20px_60px_rgba(14,165,233,0.15)] p-12 text-center relative z-10 animate-in zoom-in duration-500">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-4xl font-black text-[#082F49] mb-8">Tổng kết Điểm số</h2>

          <div className="w-56 h-56 mx-auto bg-gradient-to-tr from-cyan-400 to-emerald-400 rounded-full flex flex-col items-center justify-center shadow-[0_15px_30px_rgba(16,185,129,0.3)] mb-10 border-[6px] border-white">
            <div className="flex items-baseline">
              <span className="text-7xl font-black text-white drop-shadow-md">{score}</span>
              <span className="text-2xl font-bold text-white/80 ml-1">/10</span>
            </div>
            <span className="text-white/90 font-bold mt-1 text-sm uppercase tracking-widest">Điểm số</span>
          </div>

          <div className="flex justify-center gap-12 mb-10">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Số câu đúng</p>
              <p className="text-4xl font-black text-emerald-500">{correctCount}</p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Số câu sai</p>
              <p className="text-4xl font-black text-rose-500">{check.questions.length - correctCount}</p>
            </div>
          </div>
          <button onClick={onClose} className="px-10 py-5 rounded-full bg-[#082F49] hover:bg-slate-800 text-white font-black text-xl flex items-center justify-center gap-3 w-full transition shadow-[0_10px_20px_rgba(8,47,73,0.2)] hover:-translate-y-1">
            <FaCheck /> Hoàn thành
          </button>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {check.questions.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-12 bg-cyan-500' : i < currentIndex ? 'w-6 bg-emerald-400' : 'w-6 bg-slate-300/50'}`} />
            ))}
          </div>

          {/* Question Card */}
          <div className="w-full max-w-5xl w-full z-10 relative"
            style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', border: '2px solid white', borderRadius: '40px', boxShadow: '0 20px 60px rgba(14, 165, 233, 0.15)' }}>

            <div className="p-12 text-center border-b border-white/50">
              <span className="inline-block px-4 py-1 rounded-full bg-cyan-100 text-cyan-600 font-black tracking-widest text-sm mb-6">CÂU HỎI {currentIndex + 1} / {check.questions.length}</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#082F49] leading-tight drop-shadow-sm">
                {question.text}
              </h2>
            </div>

            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {question.options.map((opt, index) => {
                const isSelected = selectedAnswers[currentIndex] === index;
                const hasAnswered = selectedAnswers[currentIndex] !== undefined;
                const isCorrect = question.correctIndex === index;

                let btnStyle = 'bg-white border-sky-100 text-[#334155] shadow-sm hover:shadow-md hover:border-cyan-300 cursor-pointer';
                let idxStyle = 'bg-slate-100 text-slate-400';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500 border-emerald-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] scale-[1.02] cursor-default';
                    idxStyle = 'bg-white text-emerald-500';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500 border-rose-400 text-white shadow-[0_10px_30px_rgba(225,29,72,0.4)] scale-[1.02] cursor-default';
                    idxStyle = 'bg-white text-rose-500';
                  } else {
                    btnStyle = 'bg-slate-100/50 border-transparent text-slate-400 opacity-50 cursor-default';
                    idxStyle = 'bg-slate-200 text-slate-400';
                  }
                }

                const labels = ['A', 'B', 'C', 'D'];

                return (
                  <div key={index}
                    onClick={() => handleSelectOption(index)}
                    className={`flex items-center gap-6 p-6 rounded-3xl transition-all duration-500 border-2 ${btnStyle}`}
                  >
                    <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl text-xl font-black transition-colors ${idxStyle}`}>
                      {labels[index]}
                    </div>
                    <span className="text-2xl font-bold">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/70 backdrop-blur-xl p-3 rounded-full shadow-lg border border-white z-10">
            <button onClick={prevQuestion} disabled={isFirst} className="p-4 rounded-full hover:bg-white disabled:opacity-30 text-[#082F49] transition"><FaArrowLeft size={24} /></button>

            {selectedAnswers[currentIndex] === undefined ? (
              <button onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentIndex]: -1 }))} className="px-10 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xl flex items-center gap-3 transition shadow-[0_5px_15px_rgba(251,191,36,0.4)] hover:-translate-y-1">
                Hiển thị đáp án
              </button>
            ) : (
              <button onClick={nextQuestion} className="px-10 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-black text-xl flex items-center gap-3 transition shadow-[0_5px_15px_rgba(6,182,212,0.4)] hover:-translate-y-1">
                {isLast ? 'Tổng kết' : 'Câu tiếp theo'} <FaArrowRight />
              </button>
            )}

            <button onClick={nextQuestion} disabled={isLast} className="p-4 rounded-full hover:bg-white disabled:opacity-30 text-[#082F49] transition"><FaArrowRight size={24} /></button>
          </div>

          <p className="absolute bottom-4 right-6 text-slate-500 font-semibold text-sm z-10">Phím A, B, C, D để chọn · Enter để chuyển đổi</p>
        </>
      )}
    </div>,
    document.body
  );
}


// ─── LuckyWheel Modal ─────────────────────────────────────────────────────────
function LuckyWheelModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState('');

  useEffect(() => {
    fetch(`/api/homeclass/${classId}`)
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (d.error) setError(d.error);
        else setStudents(d.class?.members || []);
      })
      .catch(e => {
        setLoading(false);
        setError('Lỗi tải dữ liệu lớp học');
      });
  }, [classId]);

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

  const handleSpin = () => {
    if (isSpinning || students.length === 0) return;

    setWinner('');
    setIsSpinning(true);

    const spins = 5;
    const degreesPerStudent = 360 / students.length;
    const randomIndex = Math.floor(Math.random() * students.length);

    const targetRotation = 360 - ((randomIndex + 0.5) * degreesPerStudent);
    const finalRotation = rotation + (spins * 360) + (targetRotation - (rotation % 360));

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(students[randomIndex].fullName || students[randomIndex].username);
    }, 5000);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(8,47,73,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-2xl bg-[rgba(255,255,255,0.85)] backdrop-blur-[24px] border border-white rounded-[40px] p-8 shadow-[0_20px_60px_rgba(14,165,233,0.2)] text-center relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/50 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors z-30 shadow-sm border border-white"><FaTimes /></button>

        <h2 className="text-3xl font-black text-[#082F49] mb-6 flex items-center justify-center gap-3 relative z-10">
          <span className="text-4xl">🎡</span> Vòng quay may mắn
        </h2>

        {loading ? (
          <div className="py-20 text-slate-400 font-semibold relative z-10"><FaSpinner className="animate-spin inline mr-2" /> Đang tải dữ liệu học sinh...</div>
        ) : error ? (
          <div className="py-20 text-red-500 font-semibold relative z-10">{error}</div>
        ) : students.length === 0 ? (
          <div className="py-20 text-[#082F49] font-bold text-lg relative z-10">Lớp học này chưa có học sinh nào.</div>
        ) : (
          <div className="relative mx-auto w-[420px] h-[420px] mb-8 z-10">
            {/* Pointer */}
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-[#082F49] z-20 drop-shadow-md"></div>

            {/* Wheel */}
            <div className="w-full h-full rounded-full border-8 border-white shadow-[0_15px_30px_rgba(0,0,0,0.15)] relative overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 5s cubic-bezier(0.2, 0.8, 0.1, 1)',
                background: `conic-gradient(${students.map((_, i) => `${COLORS[i % COLORS.length]} ${i * (360 / students.length)}deg ${(i + 1) * (360 / students.length)}deg`).join(', ')})`
              }}>

              {/* Text / Labels */}
              {students.map((s, i) => {
                const deg = (i + 0.5) * (360 / students.length);
                return (
                  <div key={i} className="absolute inset-0 flex justify-center items-start"
                    style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="h-[50%] w-full flex items-end justify-center pb-12">
                      <span className="text-white font-bold text-sm drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis max-h-[145px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {s.fullName || s.username}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Spin Button */}
            <button onClick={handleSpin} disabled={isSpinning}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white border-4 border-slate-100 shadow-xl flex items-center justify-center font-black text-[#082F49] text-xl z-30 hover:scale-105 active:scale-95 disabled:scale-100 transition-transform">
              Quay
            </button>
          </div>
        )}

        {/* Winner Announcement */}
        <div className="h-16 flex items-center justify-center relative z-10">
          {winner && !isSpinning && (
            <div className="animate-in zoom-in slide-in-from-bottom-4 duration-500">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Người may mắn là</p>
              <p className="text-4xl font-black text-emerald-500 drop-shadow-sm flex items-center justify-center gap-3">
                <span className="animate-bounce">🎉</span>
                {winner}
                <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🎉</span>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}

// ─── Mystery Cards Modal ─────────────────────────────────────────────────────────
function MysteryCardsModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cards, setCards] = useState<any[]>([]);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const shuffleAndDeal = (list: any[]) => {
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setPickedIndex(null);
  };

  useEffect(() => {
    fetch(`/api/homeclass/${classId}`)
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (d.error) setError(d.error);
        else {
          const members = d.class?.members || [];
          setStudents(members);
          shuffleAndDeal(members);
        }
      })
      .catch(e => {
        setLoading(false);
        setError('Lỗi tải dữ liệu lớp học');
      });
  }, [classId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col p-4" style={{ background: 'rgba(8,47,73,0.85)', backdropFilter: 'blur(16px)' }}>
      {/* Header */}
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto p-4 relative z-20">
        <h2 className="text-3xl font-black text-white flex items-center gap-3 drop-shadow-md">
          <span className="text-4xl">🃏</span> Rút thẻ bài may mắn
        </h2>
        <div className="flex gap-4">
          {pickedIndex !== null && (
            <button onClick={() => shuffleAndDeal(students)} className="px-6 py-2 rounded-full bg-violet-500 hover:bg-violet-400 text-white font-bold transition shadow-lg flex items-center gap-2">
              Trộn lại bài
            </button>
          )}
          <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"><FaTimes /></button>
        </div>
      </div>

      {/* Main Content — Fan Deck */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 overflow-hidden">
        {loading ? (
          <div className="text-white/60 font-semibold text-xl"><FaSpinner className="animate-spin inline mr-2" /> Đang trộn bài...</div>
        ) : error ? (
          <div className="text-red-400 font-semibold text-xl">{error}</div>
        ) : cards.length === 0 ? (
          <div className="text-white/80 font-bold text-xl">Lớp học này chưa có học sinh nào.</div>
        ) : (
          <div className="relative w-full flex items-end justify-center" style={{ height: '320px', perspective: '1200px' }}>
            {cards.map((s, i) => {
              const total = cards.length;
              const spread = Math.min(8, 120 / total);
              const angle = (i - (total - 1) / 2) * spread;
              const overlapPx = Math.max(28, Math.min(60, 900 / total));
              const xOffset = (i - (total - 1) / 2) * overlapPx;
              const yOffset = Math.abs(angle) * 1.8;

              const isFlipped = pickedIndex === i;
              const isHidden = pickedIndex !== null && pickedIndex !== i;

              const baseTransform = `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${angle}deg)`;
              const flippedTransform = `translateX(${xOffset}px) translateY(-80px) rotate(0deg) scale(1.15)`;

              return (
                <div
                  key={i}
                  onClick={() => pickedIndex === null && setPickedIndex(i)}
                  className={`absolute bottom-0 cursor-pointer ${isHidden ? 'opacity-10 scale-90 blur-sm pointer-events-none' : ''}`}
                  style={{
                    width: '120px',
                    height: '180px',
                    transform: isFlipped ? flippedTransform : baseTransform,
                    transformOrigin: 'bottom center',
                    transformStyle: 'preserve-3d',
                    zIndex: isFlipped ? 50 : i,
                    transition: 'transform 0.35s ease, opacity 0.35s ease',
                  }}
                  onMouseEnter={e => {
                    if (pickedIndex !== null) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = `translateX(${xOffset}px) translateY(${yOffset - 45}px) rotate(${angle}deg) scale(1.1)`;
                    el.style.zIndex = '40';
                  }}
                  onMouseLeave={e => {
                    if (pickedIndex !== null) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = baseTransform;
                    el.style.zIndex = String(i);
                  }}
                >
                  {/* Card Inner (3D flip) */}
                  <div
                    className="w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.7s ease',
                    }}
                  >
                    {/* Front (Úp) */}
                    <div
                      className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-violet-500 to-fuchsia-500 border-[3px] border-white/40 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="w-[82%] h-[82%] border border-white/20 rounded-xl flex items-center justify-center"
                           style={{ backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.05) 0px,rgba(255,255,255,0.05) 10px,transparent 10px,transparent 20px)' }}>
                        <span className="text-4xl opacity-50">❓</span>
                      </div>
                    </div>

                    {/* Back (Ngửa) */}
                    <div
                      className="absolute inset-0 rounded-[18px] bg-white shadow-[0_0_30px_rgba(52,211,153,0.4)] flex flex-col items-center justify-center p-3 gap-2"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-black shadow-md shrink-0">
                        {s.avatar
                          ? <img src={s.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                          : (s.fullName || s.username).charAt(0).toUpperCase()}
                      </div>
                      <p className="text-center font-bold text-[#082F49] text-xs leading-tight line-clamp-3">
                        {s.fullName || s.username}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Winner Announcement */}
      {pickedIndex !== null && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in zoom-in slide-in-from-bottom-8 duration-500 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl px-12 py-6 rounded-[32px] border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Thẻ bài gọi tên</p>
            <p className="text-4xl font-black text-emerald-500 drop-shadow-sm flex items-center justify-center gap-3">
              <span className="animate-bounce">🎉</span>
              {cards[pickedIndex].fullName || cards[pickedIndex].username}
              <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🎉</span>
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Sheep Race Modal ─────────────────────────────────────────────────────────
type RaceState = 'idle' | 'racing' | 'finished';

const SHEEP_COLORS = [
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-green-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-teal-500',
  'from-fuchsia-400 to-pink-600',
  'from-lime-400 to-green-600',
];

function SheepRaceModal({ classId, onClose }: { classId: string; onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [raceState, setRaceState] = useState<RaceState>('idle');
  // positions[i] = 0..100 (% of track)
  const [positions, setPositions] = useState<number[]>([]);
  // speeds[i] = base speed per tick
  const [speeds, setSpeeds] = useState<number[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/homeclass/${classId}`)
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (d.error) setError(d.error);
        else {
          const members = d.class?.members || [];
          setStudents(members);
          setPositions(new Array(members.length).fill(0));
        }
      })
      .catch(() => { setLoading(false); setError('Lỗi tải dữ liệu lớp học'); });
  }, [classId]);

  const startRace = () => {
    if (raceState !== 'idle' || students.length === 0) return;
    const baseSpeedArr = students.map(() => 0.4 + Math.random() * 0.8); // 0.4–1.2
    setSpeeds(baseSpeedArr);
    setPositions(new Array(students.length).fill(0));
    setWinner(null);
    setRaceState('racing');

    // Predetermined winner (random) but race still looks organic
    const presetWinner = Math.floor(Math.random() * students.length);

    intervalRef.current = setInterval(() => {
      setPositions(prev => {
        const next = prev.map((p, i) => {
          // Boost preset winner slightly near the end
          let jitter = (Math.random() - 0.3) * 0.6;
          let boost = 0;
          if (i === presetWinner && p > 50) boost = 0.15;
          return Math.min(100, p + baseSpeedArr[i] + jitter + boost);
        });

        const finishedIdx = next.findIndex(p => p >= 100);
        if (finishedIdx !== -1) {
          clearInterval(intervalRef.current!);
          // Force winner to exactly 100
          const final = [...next];
          final[finishedIdx] = 100;
          setWinner(finishedIdx);
          setRaceState('finished');
          return final;
        }
        return next;
      });
    }, 50); // 20fps
  };

  const resetRace = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRaceState('idle');
    setPositions(new Array(students.length).fill(0));
    setWinner(null);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0A8 55%, #6DB86B 56%, #4a9e48 100%)' }}>

      {/* Clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[{x:'8%',y:'8%',s:1},{x:'35%',y:'4%',s:0.8},{x:'65%',y:'10%',s:1.1},{x:'88%',y:'6%',s:0.9}].map((c,i) => (
          <div key={i} className="absolute opacity-80" style={{ left: c.x, top: c.y, transform: `scale(${c.s})` }}>
            <div className="w-20 h-8 bg-white rounded-full relative">
              <div className="absolute -top-4 left-3 w-12 h-12 bg-white rounded-full" />
              <div className="absolute -top-6 left-7 w-10 h-10 bg-white rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-4 pb-2">
        <h2 className="text-2xl font-black text-[#082F49] drop-shadow flex items-center gap-2">
          🐑 Đua Cừu May Mắn
        </h2>
        <div className="flex gap-3">
          {raceState === 'finished' && (
            <button onClick={resetRace} className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition shadow-lg">
              🔄 Chạy lại
            </button>
          )}
          <button onClick={onClose} className="w-10 h-10 bg-white/60 hover:bg-white text-slate-600 rounded-full flex items-center justify-center transition shadow-sm">
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Race tracks */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-4 gap-1 overflow-hidden">
        {loading ? (
          <div className="text-center text-[#082F49] font-semibold text-xl">
            <FaSpinner className="animate-spin inline mr-2" /> Đang tải học sinh...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 font-semibold">{error}</div>
        ) : (
          <>
            {/* Finish line marker */}
            <div className="absolute right-[5.5%] top-0 bottom-0 w-0.5 border-r-4 border-dashed border-red-500/60 z-10 pointer-events-none">
              <div className="absolute top-2 -right-8 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">ĐÍCH</div>
            </div>

            {students.map((s, i) => {
              const pos = positions[i] ?? 0;
              const isWinner = winner === i;
              const isLoser = winner !== null && winner !== i;
              const color = SHEEP_COLORS[i % SHEEP_COLORS.length];

              return (
                <div key={i} className={`flex items-center gap-2 transition-all duration-300 ${isLoser ? 'opacity-50' : ''}`}>
                  {/* Name label */}
                  <div className="w-28 shrink-0 text-right">
                    <span className={`text-xs font-black truncate block ${isWinner ? 'text-emerald-700' : 'text-[#082F49]'}`}>
                      {s.fullName || s.username}
                    </span>
                  </div>

                  {/* Track */}
                  <div className="flex-1 relative h-10 rounded-full overflow-hidden"
                       style={{ background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.6)' }}>
                    {/* Ground texture */}
                    <div className="absolute inset-0 opacity-30"
                         style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 20px, rgba(255,255,255,0.2) 20px, rgba(255,255,255,0.2) 21px)' }} />

                    {/* Sheep */}
                    <div className="absolute top-1/2 -translate-y-1/2 transition-all"
                         style={{ left: `calc(${pos}% - 30px)`, transitionDuration: raceState === 'racing' ? '50ms' : '300ms', zIndex: 5 }}>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-base shadow-md
                        ${raceState === 'racing' ? 'animate-bounce' : ''}
                        ${isWinner ? 'ring-4 ring-yellow-300 ring-offset-1 scale-125' : ''}`}
                           style={{ animationDuration: `${0.25 + Math.random() * 0.2}s` }}>
                        🐑
                      </div>
                      {isWinner && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg animate-bounce">🏆</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Start button */}
            {raceState === 'idle' && (
              <div className="flex justify-center mt-4">
                <button onClick={startRace}
                        className="px-12 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-2xl shadow-[0_8px_24px_rgba(16,185,129,0.4)] transition hover:-translate-y-1 flex items-center gap-3">
                  🚩 Bắt đầu Đua!
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Winner banner */}
      {raceState === 'finished' && winner !== null && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in zoom-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white/95 backdrop-blur-xl px-10 py-5 rounded-[32px] border-2 border-emerald-200 shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col items-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">🏆 Người về đích!</p>
            <p className="text-4xl font-black text-emerald-500 flex items-center gap-3">
              <span className="animate-bounce">🎉</span>
              {students[winner].fullName || students[winner].username}
              <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🎉</span>
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export function OldLessonCheckClient({ user }: Props) {
  const [checks, setChecks] = useState<IOldLessonCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [presentingCheck, setPresentingCheck] = useState<IOldLessonCheck | null>(null);
  const [luckyClassId, setLuckyClassId] = useState<string | null>(null);
  const [mysteryClassId, setMysteryClassId] = useState<string | null>(null);
  const [sheepClassId, setSheepClassId] = useState<string | null>(null);

  const isTeacher = user.role === 2 || user.role === 1;

  const fetchChecks = async () => {
    if (!isTeacher) { setLoading(false); return; }
    setLoading(true);
    const res = await fetch('/api/classroom/old-lesson');
    if (res.ok) {
      const data = await res.json();
      setChecks(data.checks || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChecks();
  }, [isTeacher]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá bài kiểm tra này?')) return;
    await fetch(`/api/classroom/old-lesson/${id}`, { method: 'DELETE' });
    fetchChecks();
  };

  // Student View
  if (!isTeacher) {
    return (
      <div className="text-center py-20 rounded-[32px]" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1)' }}>
        <div className="text-6xl mb-4">👨‍🏫</div>
        <p className="font-bold text-[#082F49] text-xl mb-2">Phần này dành cho giáo viên</p>
        <p className="text-[#94A3B8]">Giáo viên sẽ sử dụng tính năng này để trình chiếu câu hỏi trên lớp học.</p>
      </div>
    );
  }

  // Teacher View
  return (
    <>
      {showCreate && <CreateCheckModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchChecks(); }} />}
      {presentingCheck && <PresenterMode check={presentingCheck} onClose={() => setPresentingCheck(null)} />}
      {luckyClassId && <LuckyWheelModal classId={luckyClassId} onClose={() => setLuckyClassId(null)} />}
      {mysteryClassId && <MysteryCardsModal classId={mysteryClassId} onClose={() => setMysteryClassId(null)} />}
      {sheepClassId && <SheepRaceModal classId={sheepClassId} onClose={() => setSheepClassId(null)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#082F49] flex items-center gap-3">
              <span className="text-3xl">📝</span> Kiểm tra bài cũ
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">Tạo câu hỏi nhanh và trình chiếu lên màn hình lớp học</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition border-[2px] border-[#06B6D4]">
            <FaPlus size={13} /> Tạo bài kiểm tra
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-semibold">Đang tải...</div>
        ) : checks.length === 0 ? (
          <div className="text-center py-16 rounded-[32px] bg-white/50 border border-dashed border-cyan-300">
            <div className="text-5xl mb-4 opacity-50">📂</div>
            <p className="font-bold text-[#082F49] mb-1">Chưa có bài kiểm tra nào</p>
            <p className="text-sm text-[#94A3B8]">Bấm "Tạo bài kiểm tra" để bắt đầu soạn câu hỏi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checks.map(check => (
              <div key={check._id} className="rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 relative group"
                style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 1)', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.08)' }}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-[#082F49] line-clamp-2 pr-4">{check.title}</h3>
                  <button onClick={() => handleDelete(check._id)} className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition">
                    <FaTrash size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-600 text-xs font-bold">
                    {check.questions.length} câu hỏi
                  </span>
                  <div className="flex gap-2">
                    {check.classId && (
                      <>
                        <button onClick={() => setSheepClassId(check.classId!)} className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 text-green-700 shadow-[0_5px_15px_rgba(16,185,129,0.15)] transition hover:-translate-y-0.5" title="Đua Cừu May Mắn">
                          🐑
                        </button>
                        <button onClick={() => setMysteryClassId(check.classId!)} className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600 shadow-[0_5px_15px_rgba(139,92,246,0.2)] transition hover:-translate-y-0.5" title="Rút thẻ bài">
                          🃏
                        </button>
                        <button onClick={() => setLuckyClassId(check.classId!)} className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-900 shadow-[0_5px_15px_rgba(251,191,36,0.3)] transition hover:-translate-y-0.5" title="Vòng quay may mắn">
                          🎡
                        </button>
                      </>
                    )}
                    <button onClick={() => setPresentingCheck(check)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-[0_5px_15px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5">
                      <FaPlay size={10} /> Trình chiếu ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
