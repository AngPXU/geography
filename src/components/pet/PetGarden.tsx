'use client';

import { useState, useEffect } from 'react';
import VirtualPet from './VirtualPet';
import { getPetInfo } from '@/utils/petSystem';
import { PetInfoModal } from './PetInfoModal';

interface PetGardenProps {
  initialPetExp: number;
  initialCoins: number;
}

export function PetGarden({ initialPetExp, initialCoins }: PetGardenProps) {
  const [petExp, setPetExp] = useState(initialPetExp);
  const [coins, setCoins] = useState(initialCoins);
  const [isFeeding, setIsFeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cập nhật lại state nếu initial props thay đổi từ DB
  useEffect(() => {
    setPetExp(initialPetExp);
    setCoins(initialCoins);
  }, [initialPetExp, initialCoins]);

  const [showInfo, setShowInfo] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{show: boolean, level: number, reward: number}>({show: false, level: 0, reward: 0});

  // Tính toán cấp độ (Stage) từ helper mới
  const petInfo = getPetInfo(petExp);
  const stage = petInfo.currentLevel.stage;
  const feedCost = petInfo.currentLevel.feedCost;

  const handleFeed = async () => {
    if (coins < feedCost) {
      setErrorMsg('Bạn không đủ xu! Hãy làm nhiệm vụ để kiếm thêm.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setIsFeeding(true);
    
    // Optimistic UI update
    setCoins(c => c - feedCost);
    setPetExp(e => e + 20);

    try {
      const res = await fetch('/api/pet/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      
      // Đồng bộ lại với DB thực tế
      setCoins(data.coins);
      setPetExp(data.petExp);

      if (data.leveledUp) {
        setLevelUpData({ show: true, level: data.newLevel, reward: data.rewardCoins });
        setTimeout(() => setLevelUpData(prev => ({ ...prev, show: false })), 5000);
      }
    } catch (err: any) {
      // Rollback nếu lỗi
      setCoins(c => c + feedCost);
      setPetExp(e => e - 20);
      setErrorMsg(err.message || 'Lỗi kết nối!');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setTimeout(() => setIsFeeding(false), 2000); // Giữ hiệu ứng ăn 2s
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-[24px] bg-white/60 backdrop-blur-xl border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-emerald-300/20 rounded-full blur-[40px] pointer-events-none"></div>
      
      {/* 3D Canvas Area */}
      <div className="w-full md:w-1/2 h-[250px] md:h-[300px] rounded-[16px] bg-gradient-to-b from-sky-50 to-emerald-50 border border-white/80 overflow-hidden relative shadow-inner">
        <VirtualPet stage={stage} isFeeding={isFeeding} />
        
        {/* Stage Badge */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-white shadow-sm flex items-center gap-2">
          <span className="text-xl">
            {stage === 1 ? '🥚' : stage === 2 ? '🦊' : stage === 3 ? '🐉' : '✨'}
          </span>
          <span className="text-xs font-black text-[#082F49] uppercase tracking-wider">
            {petInfo.currentLevel.stageName}
          </span>
        </div>
        
        {/* Level Up Notification */}
        {levelUpData.show && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-[slide-up_0.3s_ease-out]">
            <div className="text-5xl mb-2 animate-bounce">🎉</div>
            <h4 className="text-2xl font-black text-[#082F49]">Lên Cấp {levelUpData.level}!</h4>
            <p className="text-emerald-600 font-bold bg-emerald-100 px-3 py-1 rounded-full mt-2">+{levelUpData.reward} Xu</p>
          </div>
        )}
      </div>

      {/* Info & Controls */}
      <div className="w-full md:w-1/2 flex flex-col justify-center gap-5 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-[#082F49] flex items-center gap-2">
              Geo-Pet <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">Lv.{petInfo.currentLevel.level}</span>
            </h3>
            <p className="text-sm font-medium text-[#64748B] mt-1">
              Người bạn đồng hành 3D của bạn. Hãy cho ăn để thú cưng tiến hóa nhé!
            </p>
          </div>
          <button 
            onClick={() => setShowInfo(true)}
            className="shrink-0 w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-700 flex items-center justify-center transition-colors"
            title="Sổ tay thú cưng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/50 p-4 rounded-[16px] border border-white/60">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-[#334155] uppercase tracking-wider">Tiến trình Level</span>
            <span className="text-sm font-black text-cyan-600">
              {petExp} / {petInfo.isMaxLevel ? 'MAX' : petInfo.nextLevel?.expRequired} EXP
            </span>
          </div>
          <div className="h-3 w-full bg-slate-200/50 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${petInfo.progressPercent}%` }}
            >
              {/* Shine effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleFeed}
            disabled={isFeeding || petInfo.isMaxLevel}
            className="flex-1 py-3 px-6 bg-[#06B6D4] hover:bg-[#22D3EE] active:bg-[#0891B2] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-[16px] font-black shadow-[0_8px_16px_rgba(6,182,212,0.25)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            {isFeeding ? 'Đang ăn...' : petInfo.isMaxLevel ? 'Đã Max Level' : `🍖 Cho ăn (-${feedCost} Xu)`}
          </button>

          <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 px-4 py-2 rounded-[16px] min-w-[80px]">
            <span className="text-xs font-bold text-amber-600 uppercase">Xu của bạn</span>
            <span className="text-lg font-black text-amber-500 tabular-nums">{coins}</span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-xs font-bold text-rose-500 animate-[shake_0.4s_ease] absolute bottom-[-20px] left-0">
            ⚠️ {errorMsg}
          </p>
        )}
      </div>

      {showInfo && <PetInfoModal onClose={() => setShowInfo(false)} currentExp={petExp} />}
    </div>
  );
}
