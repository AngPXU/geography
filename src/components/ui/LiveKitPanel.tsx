'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant,
  ConnectionState,
  LocalTrackPublication,
} from 'livekit-client';
import {
  FaMicrophone, FaMicrophoneSlash, FaDesktop, FaHandPaper,
  FaVolumeMute, FaVolumeUp, FaPhoneAlt, FaPhoneSlash,
  FaUserGraduate, FaChalkboardTeacher, FaTimes,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

type DataMsg =
  | { type: 'raise-hand';   identity: string; displayName: string }
  | { type: 'lower-hand';   identity: string }
  | { type: 'allow-speak';  identity: string }
  | { type: 'mute-all' };

interface ParticipantInfo {
  identity: string;
  displayName: string;
}

interface Props {
  classroomId: string;
  username: string;
  isTeacher: boolean;
  currentUserId: string;
  /** true nếu giáo viên đang online trong phòng. Dùng để disable nút “Tham gia” của học sinh khi GV chưa vào. */
  teacherOnline: boolean;
  /** Callback khi Room instance thay đổi (connected hoặc null khi disconnect) */
  onRoomChange?: (room: Room | null) => void;
  /** Room đã kết nối từ ClassroomRoom (dùng chung cho cả quiz + voice). Khi có prop này: bỏ flow "Tham gia", chỉ hiện controls. */
  preConnectedRoom?: Room | null;
}

// ─── LiveKitPanel ─────────────────────────────────────────────────────────────

export function LiveKitPanel({ classroomId, username, isTeacher, currentUserId, teacherOnline, onRoomChange, preConnectedRoom }: Props) {
  const roomRef        = useRef<Room | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState<RemoteTrack | null>(null);
  const [screenSharerName, setScreenSharerName]   = useState<string | null>(null);

  const [connState, setConnState]           = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [error, setError]                   = useState('');
  const [isMicOn, setIsMicOn]               = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [hasRaisedHand, setHasRaisedHand]   = useState(false);
  const [canSpeak, setCanSpeak]             = useState(isTeacher);

  // Danh sách người giơ tay: identity → displayName
  const [raisedHands, setRaisedHands] = useState<Map<string, string>>(new Map());
  // Người đang nói (active speakers)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  // Danh sách participants remote
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, ParticipantInfo>>(new Map());

  // ── Refresh snapshot participants ────────────────────────────────────────
  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const map = new Map<string, ParticipantInfo>();
    room.remoteParticipants.forEach((p) => {
      map.set(p.identity, { identity: p.identity, displayName: p.name || p.identity });
    });
    setRemoteParticipants(map);
  }, []);

  // ── Gắn preConnectedRoom khi ClassroomRoom đã auto-connect cho student ───
  useEffect(() => {
    const r = preConnectedRoom;
    if (!r || r.state !== ConnectionState.Connected) return;
    if (roomRef.current === r) return; // already set up

    roomRef.current = r;
    setConnState('connected');
    refreshParticipants();

    // Handlers — mirrors connect() logic
    const onStateChange = (state: ConnectionState) => {
      if (state === ConnectionState.Disconnected) {
        setConnState('idle');
        setIsMicOn(false); setIsSharingScreen(false);
        setRemoteScreenTrack(null); setScreenSharerName(null);
        setRaisedHands(new Map()); setRemoteParticipants(new Map());
        setActiveSpeakers(new Set()); setCanSpeak(isTeacher); setHasRaisedHand(false);
        roomRef.current = null;
      }
    };
    const onSpeakers = (speakers: { identity: string }[]) =>
      setActiveSpeakers(new Set(speakers.map((s) => s.identity)));
    const onTrackSub = (track: RemoteTrack, _pub: unknown, participant: RemoteParticipant) => {
      if (track.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) {
        setRemoteScreenTrack(track); setScreenSharerName(participant.name || participant.identity);
      }
      refreshParticipants();
    };
    const onTrackUnsub = (track: RemoteTrack) => {
      if (track.source === Track.Source.ScreenShare) { setRemoteScreenTrack(null); setScreenSharerName(null); }
      refreshParticipants();
    };
    const onLocalUnpub = (pub: LocalTrackPublication) => {
      if (pub.source === Track.Source.ScreenShare) setIsSharingScreen(false);
      if (pub.source === Track.Source.Microphone)  setIsMicOn(false);
    };
    const onPartConn = () => refreshParticipants();
    const onPartDisconn = (p: RemoteParticipant) => {
      setRaisedHands((prev) => { const m = new Map(prev); m.delete(p.identity); return m; });
      refreshParticipants();
    };
    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as DataMsg;
        if (msg.type === 'raise-hand')  setRaisedHands((prev) => new Map(prev).set(msg.identity, msg.displayName));
        else if (msg.type === 'lower-hand') setRaisedHands((prev) => { const m = new Map(prev); m.delete(msg.identity); return m; });
        else if (msg.type === 'allow-speak') { if (msg.identity === currentUserId) { setCanSpeak(true); setHasRaisedHand(false); } }
        else if (msg.type === 'mute-all') {
          if (!isTeacher) { setCanSpeak(false); setHasRaisedHand(false); r.localParticipant.setMicrophoneEnabled(false).catch(() => {}); setIsMicOn(false); }
        }
      } catch { /* ignore */ }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = r as any;
    r2.on(RoomEvent.ConnectionStateChanged, onStateChange);
    r2.on(RoomEvent.ActiveSpeakersChanged, onSpeakers);
    r2.on(RoomEvent.TrackSubscribed, onTrackSub);
    r2.on(RoomEvent.TrackUnsubscribed, onTrackUnsub);
    r2.on(RoomEvent.LocalTrackUnpublished, onLocalUnpub);
    r2.on(RoomEvent.ParticipantConnected, onPartConn);
    r2.on(RoomEvent.ParticipantDisconnected, onPartDisconn);
    r2.on(RoomEvent.DataReceived, onData);

    return () => {
      r2.off(RoomEvent.ConnectionStateChanged, onStateChange);
      r2.off(RoomEvent.ActiveSpeakersChanged, onSpeakers);
      r2.off(RoomEvent.TrackSubscribed, onTrackSub);
      r2.off(RoomEvent.TrackUnsubscribed, onTrackUnsub);
      r2.off(RoomEvent.LocalTrackUnpublished, onLocalUnpub);
      r2.off(RoomEvent.ParticipantConnected, onPartConn);
      r2.off(RoomEvent.ParticipantDisconnected, onPartDisconn);
      r2.off(RoomEvent.DataReceived, onData);
      // Không disconnect — room do ClassroomRoom quản lý
      if (roomRef.current === r) roomRef.current = null;
    };
  }, [preConnectedRoom, isTeacher, currentUserId, refreshParticipants]);

  // ── Gắn track màn hình vào video element ─────────────────────────────────
  useEffect(() => {
    const el = screenVideoRef.current;
    if (!el) return;
    if (remoteScreenTrack) {
      remoteScreenTrack.attach(el);
      return () => { remoteScreenTrack.detach(); };
    }
  }, [remoteScreenTrack]);

  // ── Gửi data message đến tất cả ─────────────────────────────────────────
  const sendData = useCallback(async (msg: DataMsg) => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    const payload = new TextEncoder().encode(JSON.stringify(msg));
    await room.localParticipant.publishData(payload, { reliable: true });
  }, []);

  // ── Giáo viên: cho phép 1 học sinh phát biểu ────────────────────────────
  const allowSpeak = useCallback(async (participantIdentity: string) => {
    // 1. Gửi data message để client biết ngay
    await sendData({ type: 'allow-speak', identity: participantIdentity });
    // 2. Cấp quyền thật sự qua LiveKit server API
    await fetch(`/api/classroom/${classroomId}/livekit-permission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIdentity, canPublish: true }),
    }).catch(() => {});
    setRaisedHands((prev) => { const m = new Map(prev); m.delete(participantIdentity); return m; });
  }, [classroomId, sendData]);

  // ── Giáo viên: tắt mic tất cả ────────────────────────────────────────────
  const muteAll = useCallback(async () => {
    await sendData({ type: 'mute-all' });
    // Thu hồi quyền publish của tất cả học sinh qua LiveKit server API
    await fetch(`/api/classroom/${classroomId}/livekit-permission`, { method: 'DELETE' }).catch(() => {});
    setRaisedHands(new Map());
  }, [classroomId, sendData]);

  // ── Kết nối vào LiveKit room ─────────────────────────────────────────────
  const connect = useCallback(async () => {
    setConnState('connecting');
    setError('');
    try {
      const res = await fetch(`/api/classroom/${classroomId}/livekit-token`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Lấy token thất bại');
      }
      const { token } = await res.json() as { token: string };

      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
      if (!wsUrl) throw new Error('NEXT_PUBLIC_LIVEKIT_WS_URL chưa được cấu hình');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      // ── Sự kiện kết nối ─────────────────────────────────────────────────
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Connected)    setConnState('connected');
        if (state === ConnectionState.Disconnected) {
          setConnState('idle');
          setIsMicOn(false);
          setIsSharingScreen(false);
          setRemoteScreenTrack(null);
          setScreenSharerName(null);
          setRaisedHands(new Map());
          setRemoteParticipants(new Map());
          setActiveSpeakers(new Set());
          setCanSpeak(isTeacher);
          setHasRaisedHand(false);
        }
      });

      // ── Active speakers ──────────────────────────────────────────────────
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakers(new Set(speakers.map((s) => s.identity)));
      });

      // ── Track được subscribe ─────────────────────────────────────────────
      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant: RemoteParticipant) => {
        if (track.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) {
          setRemoteScreenTrack(track as RemoteTrack);
          setScreenSharerName(participant.name || participant.identity);
        }
        refreshParticipants();
      });

      // ── Track bị unsubscribe / unpublish ─────────────────────────────────
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.source === Track.Source.ScreenShare) {
          setRemoteScreenTrack(null);
          setScreenSharerName(null);
        }
        refreshParticipants();
      });

      // ── Local track unpublish (ví dụ user ngắt screen share) ─────────────
      room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
        if (pub.source === Track.Source.ScreenShare) setIsSharingScreen(false);
        if (pub.source === Track.Source.Microphone)  setIsMicOn(false);
      });

      // ── Participants ─────────────────────────────────────────────────────
      room.on(RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(RoomEvent.ParticipantDisconnected, (p) => {
        setRaisedHands((prev) => { const m = new Map(prev); m.delete(p.identity); return m; });
        refreshParticipants();
      });

      // ── Data messages ────────────────────────────────────────────────────
      room.on(RoomEvent.DataReceived, (payload) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload)) as DataMsg;

          if (msg.type === 'raise-hand') {
            setRaisedHands((prev) => new Map(prev).set(msg.identity, msg.displayName));
          } else if (msg.type === 'lower-hand') {
            setRaisedHands((prev) => { const m = new Map(prev); m.delete(msg.identity); return m; });
          } else if (msg.type === 'allow-speak') {
            if (msg.identity === currentUserId) {
              setCanSpeak(true);
              setHasRaisedHand(false);
            }
          } else if (msg.type === 'mute-all') {
            if (!isTeacher) {
              setCanSpeak(false);
              setHasRaisedHand(false);
              room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
              setIsMicOn(false);
            }
          }
        } catch { /* ignore malformed */ }
      });

      await room.connect(wsUrl, token);
      onRoomChange?.(room);

      // Giáo viên tự động bật mic khi vào
      if (isTeacher) {
        await room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
        setIsMicOn(true);
        // Đánh dấu live session đang active → học sinh mới được phép join
        fetch(`/api/classroom/${classroomId}/live-session-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true }),
        }).catch(() => {});
      }

      refreshParticipants();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kết nối thất bại';
      setError(msg);
      setConnState('idle');
      roomRef.current = null;
      onRoomChange?.(null);
    }
  }, [classroomId, isTeacher, currentUserId, refreshParticipants, onRoomChange]);

  // ── Ngắt kết nối ────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (isTeacher) {
      // Tắt flag để học sinh biết phòng đã đóng
      fetch(`/api/classroom/${classroomId}/live-session-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }).catch(() => {});
    }
    await roomRef.current?.disconnect();
    roomRef.current = null;
    onRoomChange?.(null);
  }, [classroomId, isTeacher, onRoomChange]);

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(next).catch(() => {});
    setIsMicOn(next);
  }, [isMicOn]);

  // ── Screen share ─────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      if (isSharingScreen) {
        await room.localParticipant.setScreenShareEnabled(false);
        setIsSharingScreen(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
        setIsSharingScreen(true);
      }
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== 'NotAllowedError') setError('Không thể chia sẻ màn hình');
    }
  }, [isSharingScreen]);

  // ── Raise hand (học sinh) ─────────────────────────────────────────────────
  const toggleRaiseHand = useCallback(async () => {
    const next = !hasRaisedHand;
    setHasRaisedHand(next);
    await sendData(
      next
        ? { type: 'raise-hand', identity: currentUserId, displayName: username }
        : { type: 'lower-hand', identity: currentUserId },
    );
  }, [hasRaisedHand, currentUserId, username, sendData]);

  // ── Cleanup khi unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => { roomRef.current?.disconnect().catch(() => {}); };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-[24px] overflow-hidden border border-white"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 30px rgba(14,165,233,0.1)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
              connState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
            }`}
          />
          <span className="font-black text-sm text-[#082F49]">
            {connState === 'idle'       && '🎙️ Phòng học trực tiếp'}
            {connState === 'connecting' && '⏳ Đang kết nối...'}
            {connState === 'connected'  && '🟢 Đang kết nối trực tiếp'}
          </span>
        </div>

        {/* Chỉ teacher mới tự kết nối; student auto-connect qua preConnectedRoom */}
        {!preConnectedRoom && connState === 'idle' && (
          teacherOnline ? (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-4 py-2 rounded-[14px] text-white font-bold text-xs shadow-md hover:-translate-y-0.5 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(to right, #06B6D4, #0284C7)', boxShadow: '0 4px 12px rgba(6,182,212,0.35)' }}
            >
              <FaPhoneAlt size={10} /> Tham gia
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#94A3B8]"
                 style={{ background: 'rgba(241,245,249,0.8)' }}>
              ⏳ Giáo viên chưa bắt đầu
            </div>
          )
        )}
        {/* Student đã auto-connect: hiển thị badge, không cần nút Tham gia/Rời */}
        {preConnectedRoom && connState === 'connected' && !isTeacher && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#16A34A]"
               style={{ background: 'rgba(187,247,208,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Đã kết nối
          </div>
        )}
        {/* Teacher: nút Rời phòng như cũ */}
        {!preConnectedRoom && connState === 'connected' && (
          <button
            onClick={disconnect}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 active:scale-95 transition-all shadow-sm"
          >
            <FaPhoneSlash size={10} /> Rời phòng
          </button>
        )}
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs font-semibold text-[#DC2626]"
             style={{ background: 'rgba(254,226,226,0.8)' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}><FaTimes size={10} /></button>
        </div>
      )}

      {/* ── Idle state hint — chỉ hiện khi không có preConnectedRoom ──── */}
      {connState === 'idle' && !error && !preConnectedRoom && (
        <div className="px-5 py-4">
          {teacherOnline ? (
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Bấm <strong>Tham gia</strong> để vào phòng học trực tiếp với âm thanh và chia sẻ màn hình.
              {!isTeacher && ' Mic của bạn sẽ tắt mặc định — giơ tay để được giáo viên cho phép nói.'}
            </p>
          ) : (
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {isTeacher
                ? 'Bấm “Tham gia” để bắt đầu buổi học trực tiếp.'
                : '⏳ Giáo viên chưa bắt đầu buổi học. Hãy đợi giáo viên vào phòng trước nhé!'}
            </p>
          )}
        </div>
      )}

      {/* ── Connecting state ────────────────────────────────────────────── */}
      {connState === 'connecting' && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-300/30 border-t-[#06B6D4] animate-spin" />
          <p className="text-sm text-[#94A3B8] font-medium">Đang kết nối vào phòng học...</p>
        </div>
      )}

      {/* ── Connected UI ─────────────────────────────────────────────────── */}
      {connState === 'connected' && (
        <div className="flex flex-col gap-0">

          {/* ── Chờ giáo viên (student pre-connected, teacher chưa vào) ─ */}
          {!isTeacher && !teacherOnline && (
            <div className="flex items-center gap-3 px-5 py-4"
                 style={{ background: 'rgba(254,240,138,0.25)', borderBottom: '1px solid rgba(253,230,138,0.4)' }}>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                Đã kết nối phòng — Chờ giáo viên bắt đầu buổi học...
              </p>
            </div>
          )}

          {/* ── Remote screen share video ─────────────────────────────── */}
          {(remoteScreenTrack || isSharingScreen) && (
            <div className="relative bg-black">
              {/* Video element luôn được render để attach() hoạt động */}
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-h-[50vh] object-contain ${remoteScreenTrack ? 'block' : 'hidden'}`}
              />
              {isSharingScreen && (
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-xl animate-pulse shrink-0">
                    📡
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#082F49]">Màn hình của bạn đang được chia sẻ</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">Tất cả trong lớp đều có thể thấy</p>
                  </div>
                </div>
              )}
              {remoteScreenTrack && screenSharerName && (
                <div className="absolute bottom-2 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white bg-black/60">
                  📺 {screenSharerName}
                </div>
              )}
            </div>
          )}

          {/* ── Controls bar ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100/60 flex-wrap">

            {/* Mic button — học sinh chỉ thấy khi được cho phép */}
            {(isTeacher || canSpeak) && (
              <button
                onClick={toggleMic}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isMicOn
                    ? 'bg-[#06B6D4] text-white shadow-md shadow-cyan-200'
                    : 'bg-slate-100 text-[#94A3B8] hover:bg-slate-200'
                }`}
                title={isMicOn ? 'Tắt mic' : 'Bật mic'}
              >
                {isMicOn ? <FaMicrophone size={11} /> : <FaMicrophoneSlash size={11} />}
                {isMicOn ? 'Mic bật' : 'Mic tắt'}
              </button>
            )}

            {/* Screen share button */}
            <button
              onClick={toggleScreenShare}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isSharingScreen
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
              }`}
            >
              <FaDesktop size={11} />
              {isSharingScreen ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
            </button>

            {/* Raise hand — chỉ học sinh chưa được cho phép */}
            {!isTeacher && !canSpeak && (
              <button
                onClick={toggleRaiseHand}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  hasRaisedHand
                    ? 'bg-amber-400 text-white shadow-md shadow-amber-200 animate-bounce'
                    : 'bg-slate-100 text-[#334155] hover:bg-amber-50 hover:text-amber-600'
                }`}
                style={{ animationDuration: '1.5s' }}
              >
                <FaHandPaper size={11} />
                {hasRaisedHand ? 'Hạ tay' : 'Giơ tay'}
              </button>
            )}

            {/* Mute all — chỉ giáo viên */}
            {isTeacher && (
              <button
                onClick={muteAll}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-[#DC2626] hover:bg-red-50 transition-all duration-200 ml-auto"
              >
                <FaVolumeMute size={11} /> Tắt mic tất cả
              </button>
            )}
          </div>

          {/* ── Raised hands panel (giáo viên) ────────────────────────── */}
          {isTeacher && raisedHands.size > 0 && (
            <div className="px-4 py-3 border-b border-amber-100/60"
                 style={{ background: 'rgba(254,240,138,0.25)' }}>
              <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider mb-2">
                ✋ {raisedHands.size} học sinh giơ tay
              </p>
              <div className="flex flex-col gap-1.5">
                {Array.from(raisedHands.entries()).map(([identity, displayName]) => (
                  <div key={identity} className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl"
                       style={{ background: 'rgba(255,255,255,0.7)' }}>
                    <div className="flex items-center gap-2">
                      <FaHandPaper size={10} className="text-amber-500" />
                      <span className="text-xs font-semibold text-[#082F49]">{displayName}</span>
                    </div>
                    <button
                      onClick={() => allowSpeak(identity)}
                      className="px-3 py-1 rounded-full bg-[#22C55E] text-white text-[10px] font-bold hover:bg-[#4ADE80] transition-all"
                    >
                      Cho phép nói
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Participants + speaker indicators ─────────────────────── */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-[#94A3B8] font-extrabold uppercase tracking-wider mb-2">
              Trong phòng · {remoteParticipants.size + 1} người
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Bản thân */}
              <ParticipantBadge
                displayName={username}
                isSelf
                isTeacher={isTeacher}
                isSpeaking={activeSpeakers.has(currentUserId)}
                isMuted={!isMicOn}
              />
              {/* Remote participants */}
              {Array.from(remoteParticipants.values()).map((p) => (
                <ParticipantBadge
                  key={p.identity}
                  displayName={p.displayName}
                  isSelf={false}
                  isTeacher={false}
                  isSpeaking={activeSpeakers.has(p.identity)}
                  hasRaisedHand={raisedHands.has(p.identity)}
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── ParticipantBadge ─────────────────────────────────────────────────────────

function ParticipantBadge({
  displayName,
  isSelf,
  isTeacher,
  isSpeaking,
  isMuted,
  hasRaisedHand,
}: {
  displayName: string;
  isSelf: boolean;
  isTeacher: boolean;
  isSpeaking: boolean;
  isMuted?: boolean;
  hasRaisedHand?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-[11px] font-semibold transition-all duration-300 ${
        isSpeaking
          ? 'border-[#22C55E] text-[#15803D] shadow-[0_0_10px_rgba(34,197,94,0.3)]'
          : 'border-white/80 text-[#334155]'
      }`}
      style={{ background: isSpeaking ? 'rgba(220,252,231,0.85)' : 'rgba(255,255,255,0.65)' }}
    >
      {isTeacher ? (
        <FaChalkboardTeacher size={10} className="text-[#06B6D4]" />
      ) : (
        <FaUserGraduate size={10} className="text-[#94A3B8]" />
      )}
      <span>{displayName}</span>
      {isSelf && <span className="text-[8px] text-[#06B6D4] font-bold">(bạn)</span>}
      {isSpeaking && <FaVolumeUp size={8} className="text-[#22C55E]" />}
      {!isSpeaking && isMuted && <FaMicrophoneSlash size={8} className="text-[#94A3B8]" />}
      {hasRaisedHand && (
        <span className="absolute -top-2 -right-1 text-[10px] animate-bounce" style={{ animationDuration: '1s' }}>
          ✋
        </span>
      )}
    </div>
  );
}
