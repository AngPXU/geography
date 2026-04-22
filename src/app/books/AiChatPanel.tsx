'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface Props {
  pdfUrl: string;
  pageNumber: number;
  bookTitle: string;
  grade: number;
  color: string;
  /** Gọi để lấy text trang hiện tại */
  getPageText: () => Promise<string>;
  /** Gọi để lấy ảnh canvas trang hiện tại (base64) */
  getPageImage: () => string | null;
  onClose: () => void;
}

export default function AiChatPanel({
  pageNumber, bookTitle, grade, color,
  getPageText, getPageImage, onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: `Xin chào! Mình là **GeoBot** 🌍✨\n\nMình đang xem **trang ${pageNumber}** cùng bạn. Hỏi mình bất cứ điều gì về nội dung trang này nhé — mình sẽ giải thích dễ hiểu nhất có thể! 🎓`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoad]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cập nhật welcome message khi chuyển trang
  useEffect(() => {
    setMessages([{
      role: 'ai',
      text: `Mình đang xem **trang ${pageNumber}** cùng bạn 📖\nHỏi mình bất cứ điều gì về nội dung này nhé!`,
      timestamp: new Date(),
    }]);
  }, [pageNumber]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(m => [...m, { role: 'user', text: q, timestamp: new Date() }]);
    setLoad(true);

    try {
      // ① Trích xuất text trang hiện tại (nhanh, cho context)
      const pageText = await getPageText().catch(() => '');
      // ② Chụp ảnh canvas trang (để AI thấy bản đồ, sơ đồ, hình ảnh)
      const imageBase64 = getPageImage();

      const res = await fetch('/api/ai/ask-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          pageNumber,
          bookTitle,
          grade,
          pageText,
          imageBase64,
        }),
      });

      const data = await res.json();
      setMessages(m => [...m, {
        role: 'ai',
        text: data.answer ?? 'Xin lỗi, mình không thể trả lời lúc này. Thử lại nhé!',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(m => [...m, {
        role: 'ai',
        text: '⚠️ Kết nối AI bị gián đoạn. Kiểm tra lại mạng và thử lại nhé!',
        timestamp: new Date(),
      }]);
    } finally {
      setLoad(false);
      inputRef.current?.focus();
    }
  };

  const formatText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'transparent',
      borderLeft: 'none',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', flexShrink: 0,
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 9999, flexShrink: 0,
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: `0 4px 12px ${color}40`,
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 900, fontSize: 14, color: '#082F49', lineHeight: 1.2 }}>GeoBot AI</p>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Trang {pageNumber} • Hỏi tôi bất cứ điều gì</p>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 9999, border: 'none',
          background: 'rgba(148,163,184,0.15)', color: '#64748B',
          cursor: 'pointer', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 700,
        }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '87%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: 13, lineHeight: 1.6, fontWeight: 500,
              ...(msg.role === 'user' ? {
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: 'white',
              } : {
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#334155',
                border: '1px solid rgba(255, 255, 255, 0.9)',
              }),
            }}
              dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
            />
            <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 600, marginTop: 4, paddingLeft: 4 }}>
              {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: color,
                  animation: `bounce 1.2s ease infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div style={{ padding: '8px 14px 4px', flexShrink: 0, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
        {['Giải thích nội dung trang này', 'Tóm tắt bài học', 'Tôi không hiểu phần này'].map(s => (
          <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
            style={{
              padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
              background: `${color}12`, color, border: `1px solid ${color}30`,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '10px 14px', flexShrink: 0,
        borderTop: '1px solid rgba(255, 255, 255, 0.8)',
        background: 'rgba(255, 255, 255, 0.5)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Hỏi GeoBot về nội dung trang này..."
          rows={2}
          style={{
            flex: 1, borderRadius: 16, padding: '8px 14px',
            fontSize: 13, fontWeight: 500, resize: 'none',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            outline: 'none', color: '#334155', lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: 9999, flexShrink: 0,
            background: !input.trim() || loading ? 'rgba(255, 255, 255, 0.6)' : `linear-gradient(135deg, ${color}, ${color}bb)`,
            border: 'none', cursor: !input.trim() || loading ? 'default' : 'pointer',
            color: 'white', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s', boxShadow: !input.trim() || loading ? 'none' : `0 4px 14px ${color}45`,
          }}>
          {loading ? '⋯' : '➤'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
