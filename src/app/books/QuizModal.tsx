'use client';

import { useState, useEffect } from 'react';

interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizResult {
  lessonDetected: string;
  questions: QuizQuestion[];
}

interface Props {
  pdfUrl: string;
  pageNumber: number;
  bookTitle: string;
  grade: number;
  color: string;
  getSurroundingPagesText: (span: number) => Promise<string>;
  getPageImage: () => string | null;
  onClose: () => void;
}

export default function QuizModal({
  pageNumber, bookTitle, grade, color,
  getSurroundingPagesText, getPageImage, onClose
}: Props) {
  const [status, setStatus] = useState<'loading' | 'quiz' | 'finished'>('loading');
  const [data, setData] = useState<QuizResult | null>(null);
  const [errMsg, setErrMsg] = useState('');

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loadingText, setLoadingText] = useState('Đang quét 9 trang sách để hiểu bài học...');

  useEffect(() => {
    async function generateQuiz() {
      try {
        // Step 1: Extract multi-page text
        setLoadingText(`Đang đọc nội dung trang ${Math.max(1, pageNumber - 4)} đến ${pageNumber + 4}...`);
        const pagesText = await getSurroundingPagesText(4);
        
        let finalPagesText = pagesText;
        let imageBase64 = null;

        if (!pagesText.trim()) {
          setLoadingText('Phát hiện trang ảnh/scan. Đang nạp hệ thống Vision AI...');
          imageBase64 = getPageImage();
          if (!imageBase64) throw new Error('Không có chữ và cũng không thể xuất hình ảnh từ trang này.');
          finalPagesText = 'Không có văn bản dạng text vì PDF này là bản scan. Hãy dùng hình ảnh đính kèm để trích xuất nội dung bài học trang hiện tại.';
        }

        // Step 2: Request AI
        setLoadingText('GeoBot đang chắt lọc kiến thức và biên soạn câu hỏi...');
        const res = await fetch('/api/ai/quiz-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagesText: finalPagesText,
            imageBase64,
            currentPage: pageNumber,
            bookTitle,
            grade
          })
        });

        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Lỗi kết nối AI');
        }

        const quizResult: QuizResult = await res.json();
        if (!quizResult.questions || quizResult.questions.length === 0) {
          throw new Error('Không tìm thấy nội dung ôn tập phù hợp cho đoạn này.');
        }

        setData(quizResult);
        setStatus('quiz');

      } catch (err: any) {
        setErrMsg(err.message || 'Lỗi không xác định');
      }
    }
    
    generateQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (idx: number) => {
    if (showExplanation) return; // Prevent double click
    setSelectedIdx(idx);
    setShowExplanation(true);

    if (idx === data!.questions[currentQ].answerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedIdx(null);
    setShowExplanation(false);
    if (currentQ < data!.questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStatus('finished');
    }
  };

  /* ── CSS Animations ── */
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(8, 28, 52, 0.65)', backdropFilter: 'blur(12px)',
    padding: 16
  };
  const modalStyle: React.CSSProperties = {
    width: '100%', maxWidth: 520, borderRadius: 32, overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 32px 80px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    display: 'flex', flexDirection: 'column',
    position: 'relative'
  };
  const btnClose: React.CSSProperties = {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32,
    borderRadius: '50%', background: 'rgba(255,255,255,0.3)', color: 'white',
    border: 'none', cursor: 'pointer', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header Ribbon */}
        <div style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          padding: '24px 24px', color: 'white', position: 'relative'
        }}>
          <button onClick={onClose} style={btnClose}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>⚡</span>
            <div>
              <p style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>Ôn Tập Nhanh</p>
              <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>Theo sách: {bookTitle}</p>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {errMsg ? (
              <>
                <p style={{ fontSize: 40 }}>⚠️</p>
                <p style={{ color: '#DC2626', fontWeight: 700, fontSize: 15 }}>{errMsg}</p>
                <button onClick={onClose} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 9999, background: '#F1F5F9', color: '#334155', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Đóng</button>
              </>
            ) : (
              <>
                <div style={{ position: 'relative', width: 64, height: 64 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${color}20` }} />
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${color}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧠</div>
                </div>
                <p style={{ color: '#334155', fontWeight: 700, fontSize: 15 }}>{loadingText}</p>
              </>
            )}
          </div>
        )}

        {/* QUIZ STATE */}
        {status === 'quiz' && data && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Meta insight */}
            <div style={{ background: `${color}10`, padding: '10px 16px', borderRadius: 12, border: `1px solid ${color}30` }}>
              <p style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>🎯 PHẠM VI KIẾN THỨC</p>
              <p style={{ fontSize: 14, color: color, fontWeight: 900 }}>{data.lessonDetected}</p>
            </div>

            {/* Question Progress */}
            <div>
              <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700, marginBottom: 8 }}>Câu hỏi {currentQ + 1} / {data.questions.length}</p>
              <h3 style={{ fontSize: 18, color: '#082F49', fontWeight: 800, lineHeight: 1.4 }}>
                {data.questions[currentQ].q}
              </h3>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.questions[currentQ].options.map((opt, i) => {
                const isCorrectIndex = data.questions[currentQ].answerIndex;
                const isSelected = selectedIdx === i;
                
                let bColor = 'rgba(241,245,249,0.8)';
                let textColor = '#334155';
                let borderColor = 'rgba(226,232,240,0.8)';

                if (showExplanation) {
                  if (i === isCorrectIndex) {
                    bColor = '#DCFCE7'; textColor = '#16A34A'; borderColor = '#86EFAC';
                  } else if (isSelected) {
                    bColor = '#FEE2E2'; textColor = '#DC2626'; borderColor = '#FCA5A5';
                  } else {
                    bColor = 'rgba(241,245,249,0.4)'; textColor = '#94A3B8';
                  }
                } else if (isSelected) {
                  bColor = `${color}20`; textColor = color; borderColor = color;
                }

                return (
                  <button key={i} onClick={() => handleSelect(i)}
                    style={{
                      textAlign: 'left', padding: '14px 16px', borderRadius: 9999,
                      background: bColor, border: `1px solid ${borderColor}`,
                      color: textColor, fontWeight: 700, fontSize: 14, cursor: showExplanation ? 'default' : 'pointer',
                      transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'center'
                    }}>
                    <span style={{ fontSize: 18, opacity: showExplanation ? 1 : 0.4 }}>
                      {showExplanation ? (i === isCorrectIndex ? '✅' : isSelected ? '❌' : '⚪') : '⚪'}
                    </span>
                    <span style={{ flex: 1, lineHeight: 1.4 }}>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation box */}
            {showExplanation && (
              <div style={{ 
                background: selectedIdx === data.questions[currentQ].answerIndex ? '#F0FDF4' : '#FFF1F2', 
                borderLeft: `4px solid ${selectedIdx === data.questions[currentQ].answerIndex ? '#22C55E' : '#EF4444'}`,
                padding: '12px 16px', borderRadius: '4px 12px 12px 4px',
                animation: 'slideIn 0.3s ease-out'
              }}>
                <p style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                  <span style={{ fontWeight: 800 }}>Giải thích:</span> {data.questions[currentQ].explanation}
                </p>
              </div>
            )}

            {/* Next Button */}
            {showExplanation && (
              <button autoFocus onClick={nextQuestion}
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  border: 'none', color: 'white', fontWeight: 800, fontSize: 15,
                  padding: '14px 24px', borderRadius: 9999, cursor: 'pointer',
                  marginTop: 12, boxShadow: `0 8px 24px ${color}40`, alignSelf: 'flex-end', transition: 'transform 0.2s'
                }}>
                {currentQ < data.questions.length - 1 ? 'Câu tiếp theo ❯' : 'Xem kết quả'}
              </button>
            )}
          </div>
        )}

        {/* FINISHED STATE */}
        {status === 'finished' && data && (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 64, animation: 'bounce 1s infinite' }}>
              {score === data.questions.length ? '🏆' : score > 0 ? '👍' : '📚'}
            </div>
            <div>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#082F49' }}>{score} / {data.questions.length}</p>
              <p style={{ fontSize: 15, color: '#64748B', fontWeight: 600, marginTop: 4 }}>
                {score === data.questions.length ? 'Xuất sắc! Bạn đã nắm vững kiến thức bài này.' : 'Hãy đọc sách kỹ hơn một chút nữa nhé, GeoBot luôn ở đây!'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 16, width: '100%' }}>
              <button onClick={() => { setCurrentQ(0); setScore(0); setSelectedIdx(null); setShowExplanation(false); setStatus('quiz'); }}
                style={{ flex: 1, padding: '14px', borderRadius: 9999, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
                Làm lại
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: '14px', borderRadius: 9999, background: color, border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `0 8px 20px ${color}40` }}>
                Thoát
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}
