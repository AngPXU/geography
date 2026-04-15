'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaPaperPlane, FaHeart, FaReply, FaTimes,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMsg {
  _id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 1 | 2 | 3;
  text: string;
  replyTo?: { messageId: string; senderName: string; text: string };
  likes: string[];
  createdAt: string;
}

interface Props {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  isTeacher: boolean;
}

// ─── Time helper ──────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Single message bubble ────────────────────────────────────────────────────

function Bubble({
  msg,
  isMine,
  currentUserId,
  onLike,
  onReply,
}: {
  msg: ChatMsg;
  isMine: boolean;
  currentUserId: string;
  onLike: (msgId: string) => void;
  onReply: (msg: ChatMsg) => void;
}) {
  const [actionsVisible, setActionsVisible] = useState(false);
  const isStaff = msg.senderRole === 1 || msg.senderRole === 2;
  const likedByMe = msg.likes.includes(currentUserId);
  const initial = msg.senderName[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      {/* Sender name (not for own messages) */}
      {!isMine && (
        <div className="flex items-center gap-1.5 ml-9 mb-0.5">
          <p className={`text-[10px] font-bold ${isStaff ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`}>
            {msg.senderName}
            {isStaff && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#06B6D4] text-[8px] font-extrabold uppercase">
                {msg.senderRole === 1 ? 'Admin' : 'GV'}
              </span>
            )}
          </p>
        </div>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar (others only) */}
        {!isMine && (
          <div className={`w-7 h-7 rounded-full flex-shrink-0 overflow-hidden border-2 ${isStaff ? 'border-[#06B6D4]' : 'border-white'}`}>
            {msg.senderAvatar ? (
              <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${isStaff ? 'bg-gradient-to-br from-[#06B6D4] to-[#0369A1]' : 'bg-gradient-to-br from-cyan-400 to-blue-500'}`}>
                {initial}
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col gap-0">
          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`mx-1 mb-0.5 px-2 py-1 rounded-t-lg border-l-2 text-[10px] border-[#06B6D4] bg-[#E0F2FE]/60 ${isMine ? 'text-right' : 'text-left'}`}>
              <p className="font-bold text-[#06B6D4] text-[9px]">{msg.replyTo.senderName}</p>
              <p className="text-[#475569] truncate max-w-[180px]">{msg.replyTo.text}</p>
            </div>
          )}

          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-snug transition-all duration-200 ${
              isStaff && !isMine
                ? 'shadow-[0_0_0_2px_rgba(6,182,212,0.25),0_4px_16px_rgba(6,182,212,0.15)] bg-gradient-to-br from-[#E0F2FE] to-[#F0FDFF] text-[#082F49] font-medium'
                : isMine
                ? 'bg-[#06B6D4] text-white rounded-br-sm'
                : 'bg-white text-[#334155] rounded-bl-sm shadow-sm border border-gray-100'
            }`}
          >
            {msg.text}
          </div>

          {/* Timestamp + likes */}
          <div className={`flex items-center gap-2 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[9px] text-[#94A3B8]">{formatTime(msg.createdAt)}</span>
            {msg.likes.length > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-[#F87171]">
                <FaHeart size={8} /> {msg.likes.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action row (hover) */}
      <div className={`flex gap-1 mt-0.5 transition-all duration-200 ${actionsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${isMine ? 'flex-row-reverse mr-0' : 'ml-9'}`}>
        <button
          onClick={() => onLike(msg._id)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 ${
            likedByMe ? 'bg-red-100 text-red-500' : 'bg-white/80 text-[#94A3B8] hover:text-red-400 hover:bg-red-50'
          } border border-gray-100 shadow-sm`}
        >
          <FaHeart size={9} /> {likedByMe ? 'Bỏ thích' : 'Thích'}
        </button>
        <button
          onClick={() => onReply(msg)}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/80 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#E0F2FE] border border-gray-100 shadow-sm transition-all duration-200"
        >
          <FaReply size={9} /> Trả lời
        </button>
      </div>
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

export function ChatPanel({ roomId, currentUserId, currentUserName, isTeacher }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMsg | null>(null);
  const msgListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef(0);

  // ── Fetch messages (polling 3s) ──────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch(`/api/classroom/${roomId}/chat`);
      if (!r.ok) return;
      const d = await r.json() as { messages: ChatMsg[] };
      setMessages(d.messages);
      // Auto-scroll only when new messages arrive — scroll inside container, not the page
      if (d.messages.length > lastCountRef.current) {
        lastCountRef.current = d.messages.length;
        setTimeout(() => {
          if (msgListRef.current) {
            msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
          }
        }, 80);
      }
    } catch { /* ignore */ }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // ── Send ─────────────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const res = await fetch(`/api/classroom/${roomId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        replyTo: replyingTo
          ? { messageId: replyingTo._id, senderName: replyingTo.senderName, text: replyingTo.text }
          : undefined,
      }),
    });
    setSending(false);
    if (res.ok) {
      setText('');
      setReplyingTo(null);
      await fetchMessages();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Like ─────────────────────────────────────────────────────────────────
  async function handleLike(msgId: string) {
    await fetch(`/api/classroom/${roomId}/chat/${msgId}/like`, { method: 'POST' });
    await fetchMessages();
  }

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden h-full"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
      }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-b border-white/60"
           style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
        <span className="text-base">💬</span>
        <p className="font-bold text-[#082F49] text-sm">Nhắn tin</p>
        {messages.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center">
            {messages.length > 99 ? '99+' : messages.length}
          </span>
        )}
      </div>

      {/* Messages list */}
      <div ref={msgListRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
           style={{ background: 'rgba(248,250,252,0.8)' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
            <span className="text-4xl">💬</span>
            <p className="text-xs text-[#94A3B8] font-medium">Chưa có tin nhắn nào</p>
            <p className="text-[10px] text-[#CBD5E1]">Hãy là người đầu tiên nhắn tin!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Bubble
              key={msg._id}
              msg={msg}
              isMine={msg.senderId === currentUserId}
              currentUserId={currentUserId}
              onLike={handleLike}
              onReply={(m) => { setReplyingTo(m); textareaRef.current?.focus(); }}
            />
          ))
        )}
      </div>

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[#E0F2FE] flex-shrink-0"
             style={{ background: 'rgba(224,242,254,0.7)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <FaReply size={10} className="text-[#06B6D4] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-[#06B6D4]">{replyingTo.senderName}</p>
              <p className="text-[10px] text-[#475569] truncate">{replyingTo.text}</p>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="flex-shrink-0 text-[#94A3B8] hover:text-[#334155]">
            <FaTimes size={11} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 px-3 py-3 flex-shrink-0 border-t border-white/60"
           style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nhắn tin..."
          className="flex-1 resize-none px-3 py-2.5 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8]
                     bg-white border border-[#BAE6FD] shadow-[0_2px_8px_rgba(14,165,233,0.08)]
                     focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]
                     transition-all duration-300 max-h-24 overflow-y-auto"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#06B6D4] text-white flex items-center justify-center hover:bg-[#22D3EE] disabled:opacity-50 transition-all duration-300 shadow-md"
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  );
}
