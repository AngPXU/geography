'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaBolt, FaTrophy, FaPlay, FaPlus, FaTrash } from 'react-icons/fa';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    text: 'Đồng bằng sông Cửu Long có diện tích khoảng bao nhiêu km²?',
    options: ['20.000 km²', '40.000 km²', '60.000 km²', '80.000 km²'],
    correct: 1,
  },
  {
    id: 2,
    text: 'Dãy núi nào là ranh giới tự nhiên giữa Việt Nam và Lào?',
    options: ['Hoàng Liên Sơn', 'Trường Sơn Bắc', 'Trường Sơn Nam', 'Bạch Mã'],
    correct: 1,
  },
  {
    id: 3,
    text: 'Vùng có mật độ dân số cao nhất Việt Nam là?',
    options: ['Tây Nguyên', 'Đông Nam Bộ', 'Đồng bằng sông Hồng', 'Duyên hải miền Trung'],
    correct: 2,
  },
];

const COLORS = ['bg-rose-400', 'bg-blue-400', 'bg-amber-400', 'bg-emerald-400'];
const SHAPES = ['▲', '◆', '●', '■'];

interface Player {
  name: string;
  avatar: string;
  score: number;
  answered: number | null;
  correct: boolean;
}

export function QuizBuzzer() {
  const [phase, setPhase] = useState<'lobby' | 'question' | 'result' | 'leaderboard'>('lobby');
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selected, setSelected] = useState<number | null>(null);
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [newQuestion, setNewQuestion] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [players, setPlayers] = useState<Player[]>([
    { name: 'Trà My', avatar: '🧑‍🎓', score: 0, answered: null, correct: false },
    { name: 'Hoàng Anh', avatar: '👨‍🎓', score: 0, answered: null, correct: false },
    { name: 'Thảo Vy', avatar: '👩‍🎓', score: 0, answered: null, correct: false },
    { name: 'Minh Khoa', avatar: '🧒', score: 0, answered: null, correct: false },
  ]);

  // Timer
  useEffect(() => {
    if (phase !== 'question') return;
    if (timeLeft <= 0) {
      setPhase('result');
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleStartQuiz = useCallback(() => {
    setCurrentQ(0);
    setPhase('question');
    setTimeLeft(20);
    setSelected(null);
    setPlayers(p => p.map(s => ({ ...s, score: 0, answered: null, correct: false })));
  }, []);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null || phase !== 'question') return;
    setSelected(idx);
    const isCorrect = idx === questions[currentQ].correct;
    const pts = isCorrect ? Math.ceil((timeLeft / 20) * 1000) : 0;
    // Simulate random student answers
    setPlayers(prev => prev.map(s => {
      const randAns = Math.floor(Math.random() * 4);
      const sCorrect = randAns === questions[currentQ].correct;
      return { ...s, answered: randAns, correct: sCorrect, score: s.score + (sCorrect ? Math.ceil((Math.random() * 0.8 + 0.2) * 1000) : 0) };
    }));
    setTimeout(() => setPhase('result'), 800);
  }, [selected, phase, questions, currentQ, timeLeft]);

  const handleNext = useCallback(() => {
    if (currentQ + 1 >= questions.length) {
      setPhase('leaderboard');
    } else {
      setCurrentQ(q => q + 1);
      setPhase('question');
      setTimeLeft(20);
      setSelected(null);
      setPlayers(p => p.map(s => ({ ...s, answered: null, correct: false })));
    }
  }, [currentQ, questions.length]);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
          <FaBolt />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49]">Quiz Buzzer</h2>
          <p className="text-sm text-[#94A3B8]">Phát quiz live — học sinh tranh nhau trả lời nhanh nhất</p>
        </div>
      </div>

      {/* Lobby */}
      {phase === 'lobby' && (
        <div className="space-y-6">
          {/* Question bank */}
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-[#082F49]">Ngân hàng câu hỏi ({questions.length})</h3>
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="flex items-center gap-2 text-xs bg-cyan-50 text-cyan-600 hover:bg-cyan-100 font-bold px-3 py-2 rounded-full transition-colors"
              >
                <FaPlus /> Thêm câu hỏi
              </button>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 bg-blue-50/50 rounded-[16px] border border-blue-100 space-y-3">
                <input
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi mới..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors">Huỷ</button>
                  <button
                    onClick={() => {
                      if (!newQuestion.trim()) return;
                      setQuestions(q => [...q, { id: Date.now(), text: newQuestion, options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'], correct: 0 }]);
                      setNewQuestion('');
                      setShowAddForm(false);
                    }}
                    className="text-xs bg-cyan-500 text-white px-4 py-2 rounded-full font-bold hover:bg-cyan-400 transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-[14px] border border-slate-100 group">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-[#334155] flex-1 font-medium">{q.text}</p>
                  <button
                    onClick={() => setQuestions(qs => qs.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartQuiz}
              disabled={questions.length === 0}
              className="flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 text-white font-bold text-lg shadow-[0_10px_25px_rgba(249,115,22,0.35)] hover:shadow-[0_15px_35px_rgba(249,115,22,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlay /> Bắt đầu Quiz!
            </button>
          </div>
        </div>
      )}

      {/* Question phase */}
      {phase === 'question' && (
        <div className="space-y-5">
          {/* Timer + progress */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)]">
            <span className="text-sm font-bold text-[#94A3B8]">Câu {currentQ + 1}/{questions.length}</span>
            <div className="flex items-center gap-2">
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: 160, background: '#f1f5f9' }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(timeLeft / 20) * 100}%`,
                    background: timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span
                className="text-2xl font-black w-8 text-center"
                style={{ color: timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444' }}
              >
                {timeLeft}
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)]">
            <p className="text-xl font-extrabold text-[#082F49] text-center mb-6">{questions[currentQ].text}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questions[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`
                    flex items-center gap-3 p-4 rounded-[16px] text-white font-bold text-sm text-left
                    transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed
                    ${COLORS[i]}
                    ${selected === i ? 'ring-4 ring-white/50 scale-[1.02]' : ''}
                    shadow-md hover:shadow-lg
                  `}
                >
                  <span className="text-xl">{SHAPES[i]}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Student answers realtime */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {players.map((s, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md border border-white rounded-[16px] p-3 flex items-center gap-2">
                <span className="text-xl">{s.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#082F49] truncate">{s.name}</p>
                  <p className="text-xs text-[#94A3B8]">{s.answered !== null ? '✅ Đã trả lời' : '⏳ Chờ...'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === 'result' && (
        <div className="space-y-5">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)] text-center space-y-4">
            <p className="text-lg font-bold text-[#94A3B8]">Đáp án đúng</p>
            <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-[16px] text-white font-extrabold text-xl ${COLORS[questions[currentQ].correct]}`}>
              <span>{SHAPES[questions[currentQ].correct]}</span>
              {questions[currentQ].options[questions[currentQ].correct]}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {players.map((s, i) => (
                <div key={i} className={`p-3 rounded-[16px] border ${s.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'} flex items-center gap-2`}>
                  <span className="text-xl">{s.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#082F49] truncate">{s.name}</p>
                    <p className={`text-xs font-bold ${s.correct ? 'text-green-600' : 'text-red-400'}`}>
                      {s.correct ? `+${s.score} điểm` : 'Sai rồi'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="flex items-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 text-white font-bold shadow-[0_10px_25px_rgba(249,115,22,0.3)] hover:-translate-y-1 transition-all duration-300"
            >
              {currentQ + 1 >= questions.length ? '🏆 Xem bảng xếp hạng' : 'Câu tiếp theo →'}
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {phase === 'leaderboard' && (
        <div className="space-y-5">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)]">
            <h3 className="text-center text-2xl font-black text-[#082F49] mb-6 flex items-center justify-center gap-2">
              <FaTrophy className="text-amber-400" /> Kết quả cuối cùng
            </h3>
            <div className="space-y-3">
              {sortedPlayers.map((s, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-[16px] border ${i === 0 ? 'bg-amber-50 border-amber-200' : i === 1 ? 'bg-slate-50 border-slate-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                  <span className="text-2xl w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <span className="text-2xl">{s.avatar}</span>
                  <p className="font-extrabold text-[#082F49] flex-1">{s.name}</p>
                  <span className="font-black text-xl text-amber-500">{s.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => setPhase('lobby')} className="px-8 py-3 rounded-full bg-white/80 border border-white text-[#082F49] font-bold hover:bg-white transition-all shadow-sm hover:-translate-y-0.5">
              ← Chơi lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
