'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // TURN fallback
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
];

type ShareState = 'idle' | 'sharing' | 'viewing' | 'connecting';

interface Props { classroomId: string; username: string; }



export function ScreenSharePanel({ classroomId, username }: Props) {
  const [shareState, setShareState]   = useState<ShareState>('idle');
  const [sharerName, setSharerName]   = useState<string | null>(null);
  const [activeSharer, setActiveSharer] = useState<string | null>(null);
  const [errMsg, setErrMsg]           = useState('');

  const localStreamRef  = useRef<MediaStream | null>(null);
  const peerRef         = useRef<RTCPeerConnection | null>(null);
  const sharePeersRef   = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteVideoRef  = useRef<HTMLVideoElement | null>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSharingRef    = useRef(false);
  const seenSignalsRef  = useRef<Set<string>>(new Set());
  const earlyIceCandidates = useRef<{ [user: string]: any[] }>({});

  // ── Signal helper ──────────────────────────────────────────────────────────
  const postSignal = useCallback(async (type: string, payload: any, target?: string) => {
    try {
      await fetch(`/api/classroom/${classroomId}/screen-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, targetUsername: target }),
      });
    } catch (_) {}
  }, [classroomId]);

  // ── Sharer: handle request-offer → send complete offer (non‑trickle) ───────
  const handleRequestOffer = useCallback(async (viewerUsername: string) => {
    if (!isSharingRef.current || !localStreamRef.current) return;

    // Close any existing peer for this viewer
    const old = sharePeersRef.current.get(viewerUsername);
    if (old) { try { old.close(); } catch (_) {} }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    sharePeersRef.current.set(viewerUsername, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) postSignal('ice-candidate', e.candidate.toJSON(), viewerUsername);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try { pc.close(); } catch (_) {}
        sharePeersRef.current.delete(viewerUsername);
      }
    };

    // Add all local tracks
    localStreamRef.current.getTracks().forEach(t =>
      pc.addTrack(t, localStreamRef.current!)
    );

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await postSignal('offer', { sdp: offer.sdp, type: offer.type }, viewerUsername);
  }, [postSignal]);

  // ── Viewer: receive complete offer → create complete answer ────────────────
  const handleOffer = useCallback(async (sharerUsername: string, payload: any) => {
    if (isSharingRef.current) return; // we are the sharer, ignore
    if (peerRef.current) { try { peerRef.current.close(); } catch (_) {} }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) postSignal('ice-candidate', e.candidate.toJSON(), sharerUsername);
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        setShareState('viewing');
        setErrMsg('');
      } else if (pc.iceConnectionState === 'failed') {
        // Chỉ cleanup khi thất bại hoàn toàn (failed), trạng thái disconnected có thể tự phục hồi do STUN
        doCleanupViewing();
        setErrMsg('Mạng chặn P2P. Không thể kết nối xuyên mạng.');
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }));
    
    if (earlyIceCandidates.current[sharerUsername]) {
      for (const cand of earlyIceCandidates.current[sharerUsername]) {
        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
      }
      delete earlyIceCandidates.current[sharerUsername];
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await postSignal('answer', { sdp: answer.sdp, type: answer.type }, sharerUsername);
  }, [postSignal]); // eslint-disable-line

  // ── Sharer: receive answer → complete handshake ────────────────────────────
  const handleAnswer = useCallback(async (viewerUsername: string, payload: any) => {
    const pc = sharePeersRef.current.get(viewerUsername);
    if (!pc) return;
    if (pc.signalingState !== 'have-local-offer') return;
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }));
    
    if (earlyIceCandidates.current[viewerUsername]) {
      for (const cand of earlyIceCandidates.current[viewerUsername]) {
        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
      }
      delete earlyIceCandidates.current[viewerUsername];
    }
  }, []);

  // ── Handle incoming ICE candidates ───────────────────────────────────────────
  const handleIce = useCallback(async (senderUsername: string, payload: any) => {
    let pc: RTCPeerConnection | null | undefined = null;
    if (isSharingRef.current) pc = sharePeersRef.current.get(senderUsername);
    else pc = peerRef.current;
    
    if (pc && pc.remoteDescription) {
      try { await pc.addIceCandidate(new RTCIceCandidate(payload)); } catch (_) {}
    } else {
      if (!earlyIceCandidates.current[senderUsername]) earlyIceCandidates.current[senderUsername] = [];
      earlyIceCandidates.current[senderUsername].push(payload);
    }
  }, []);

  // ── Cleanup viewer ─────────────────────────────────────────────────────────
  function doCleanupViewing() {
    if (peerRef.current) { try { peerRef.current.close(); } catch (_) {} peerRef.current = null; }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setShareState('idle');
    setSharerName(null);
  }

  const cleanupViewing = useCallback(doCleanupViewing, []); // eslint-disable-line

  // ── Poll ───────────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/classroom/${classroomId}/screen-signal`);
      if (!res.ok) return;
      const { signals } = await res.json();
      if (!Array.isArray(signals)) return;

      for (const sig of signals) {
        const id = sig._id?.toString();
        if (id && seenSignalsRef.current.has(id)) continue;
        if (id) seenSignalsRef.current.add(id);

        const { type, senderUsername, payload } = sig;

        if (type === 'announce') {
          setActiveSharer(senderUsername);
          if (isSharingRef.current) continue;
          setSharerName(senderUsername);
          setShareState('connecting');
          // Ask sharer to send us the offer
          await postSignal('request-offer', null, senderUsername);
        }
        else if (type === 'stop') {
          setActiveSharer(null);
          if (!isSharingRef.current) cleanupViewing();
        }
        else if (type === 'request-offer') {
          await handleRequestOffer(senderUsername);
        }
        else if (type === 'offer') {
          await handleOffer(senderUsername, payload);
        }
        else if (type === 'answer') {
          await handleAnswer(senderUsername, payload);
        }
        else if (type === 'ice-candidate') {
          await handleIce(senderUsername, payload);
        }
      }

      if (seenSignalsRef.current.size > 300) seenSignalsRef.current.clear();
    } catch (_) {}
  }, [classroomId, postSignal, handleRequestOffer, handleOffer, handleAnswer, handleIce, cleanupViewing]);

  useEffect(() => {
    pollRef.current = setInterval(poll, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  // ── Reconnect to active share ──────────────────────────────────────────────
  const reconnectToShare = useCallback(async () => {
    if (!activeSharer) return;
    setSharerName(activeSharer);
    setShareState('connecting');
    await postSignal('request-offer', null, activeSharer);
  }, [activeSharer, postSignal]);

  // ── Start sharing ──────────────────────────────────────────────────────────
  const startSharing = useCallback(async () => {
    setErrMsg('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
      localStreamRef.current = stream;
      isSharingRef.current = true;
      seenSignalsRef.current.clear();
      setShareState('sharing');
      setSharerName(username);
      setActiveSharer(username);
      await postSignal('announce', { sharer: username });
      stream.getVideoTracks()[0].addEventListener('ended', () => stopSharing());
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') setErrMsg('Không thể chia sẻ màn hình. Thử lại sau.');
    }
  }, [username, postSignal]); // eslint-disable-line

  // ── Stop sharing ───────────────────────────────────────────────────────────
  const stopSharing = useCallback(async () => {
    isSharingRef.current = false;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    sharePeersRef.current.forEach(pc => { try { pc.close(); } catch (_) {} });
    sharePeersRef.current.clear();
    seenSignalsRef.current.clear();
    setShareState('idle');
    setSharerName(null);
    setActiveSharer(null);
    await postSignal('stop', null);
  }, [postSignal]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (isSharingRef.current) {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        sharePeersRef.current.forEach(pc => { try { pc.close(); } catch (_) {} });
        navigator.sendBeacon(
          `/api/classroom/${classroomId}/screen-signal`,
          new Blob([JSON.stringify({ type: 'stop', payload: null })], { type: 'application/json' })
        );
      }
      if (peerRef.current) { try { peerRef.current.close(); } catch (_) {} }
    };
  }, [classroomId]);

  const toggleFullscreen = () => {
    if (!remoteVideoRef.current) return;
    document.fullscreenElement
      ? document.exitFullscreen()
      : remoteVideoRef.current.requestFullscreen().catch(() => {});
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-[24px] overflow-hidden border border-white shadow-[0_8px_30px_rgba(14,165,233,0.1)]"
      style={{ background:'rgba(255,255,255,0.75)', backdropFilter:'blur(20px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${shareState !== 'idle' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="font-black text-sm text-[#082F49]">
            {shareState === 'idle'       && '📺 Chia sẻ màn hình'}
            {shareState === 'sharing'    && '📡 Bạn đang chia sẻ màn hình'}
            {shareState === 'viewing'    && `👁️ Màn hình của ${sharerName}`}
            {shareState === 'connecting' && `⏳ Đang chuẩn bị nhận màn hình...`}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          {shareState === 'idle' && !activeSharer && (
            <button onClick={startSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white font-bold text-xs shadow-md shadow-cyan-200 hover:-translate-y-0.5 active:scale-95 transition-all">
              📺 Chia sẻ màn hình
            </button>
          )}
          {shareState === 'idle' && activeSharer && (
            <button onClick={reconnectToShare}
              className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-200 hover:-translate-y-0.5 active:scale-95 transition-all">
              🔄 K.nối lại với {activeSharer}
            </button>
          )}
          {shareState === 'sharing' && (
            <button onClick={stopSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold text-xs shadow-md shadow-rose-200 hover:-translate-y-0.5 active:scale-95 transition-all">
              ⏹ Dừng chia sẻ
            </button>
          )}
          {shareState === 'viewing' && (
            <div className="flex gap-2">
              <button onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition">
                🔍 Toàn màn hình
              </button>
              <button onClick={cleanupViewing}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-200 transition">
                ✕ Đóng
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video stream */}
      {(shareState === 'viewing' || shareState === 'connecting') && (
        <div className={`relative bg-black group ${shareState === 'connecting' ? 'min-h-[80px]' : ''}`}
          onClick={shareState === 'viewing' ? toggleFullscreen : undefined}
          style={{ cursor: shareState === 'viewing' ? 'pointer' : 'default' }}>
          <video ref={remoteVideoRef} autoPlay playsInline muted
            className={`w-full max-h-[55vh] object-contain transition-opacity duration-500 ${shareState === 'viewing' ? 'opacity-100' : 'opacity-0 absolute'}`} />
          {shareState === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">
                Đang nhận màn hình từ <strong className="text-[#082F49]">{sharerName}</strong>...
              </p>
              <p className="text-xs text-slate-400">Kết nối trực tiếp P2P — thường dưới 10 giây ⚡</p>
            </div>
          )}
          {shareState === 'viewing' && (
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              Click để phóng to
            </div>
          )}
        </div>
      )}

      {/* Sharing self */}
      {shareState === 'sharing' && (
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-xl animate-pulse shrink-0">📡</div>
          <div>
            <p className="font-bold text-sm text-[#082F49]">Màn hình của bạn đang được chia sẻ</p>
            <p className="text-xs text-slate-400 mt-0.5">Học sinh trong lớp có thể xem màn hình của bạn</p>
          </div>
        </div>
      )}

      {/* Idle hint */}
      {shareState === 'idle' && (
        <div className="px-5 py-3.5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Cả giáo viên lẫn học sinh đều có thể chia sẻ màn hình. Chỉ một người được chia sẻ tại một thời điểm.
          </p>
          {errMsg && <p className="text-xs font-bold text-rose-500 mt-2">{errMsg}</p>}
        </div>
      )}
    </div>
  );
}
