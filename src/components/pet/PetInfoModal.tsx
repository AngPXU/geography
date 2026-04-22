import { PET_LEVELS, PetLevelData } from '@/utils/petSystem';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface PetInfoModalProps {
  onClose: () => void;
  currentExp: number;
}

export function PetInfoModal({ onClose, currentExp }: PetInfoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Nền mờ Glassmorphism */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Nội dung Modal */}
      <div 
        className="relative w-full max-w-lg rounded-[24px] overflow-hidden bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_20px_40px_rgba(8,47,73,0.15)] animate-[slide-up_0.3s_ease-out]"
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-[#082F49] flex items-center gap-2">
              📖 Sổ tay Linh Thú
            </h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {PET_LEVELS.map((lvlData: PetLevelData, index) => {
              const isPassed = currentExp >= lvlData.expRequired;
              const isNext = index > 0 && currentExp >= PET_LEVELS[index - 1].expRequired && currentExp < lvlData.expRequired;
              const isCurrent = index === 0 ? currentExp < PET_LEVELS[1].expRequired : (isPassed && (!PET_LEVELS[index + 1] || currentExp < PET_LEVELS[index + 1].expRequired));

              return (
                <div 
                  key={lvlData.level} 
                  className={`p-4 rounded-[16px] border ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-300 shadow-md transform scale-[1.02]' 
                      : isPassed
                        ? 'bg-white border-slate-200 opacity-60'
                        : 'bg-slate-50 border-slate-200'
                  } transition-all`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                        isPassed || isCurrent ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {lvlData.level}
                      </span>
                      <div>
                        <span className="font-bold text-[#082F49]">Level {lvlData.level}</span>
                        {isCurrent && <span className="ml-2 text-[10px] font-black text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">HIỆN TẠI</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500">
                        Mốc EXP: <span className="text-cyan-600">{lvlData.expRequired}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white/50 rounded-lg p-2 text-center border border-white">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Hình thái</span>
                      <span className="text-sm font-black text-[#082F49]">{lvlData.stageName}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2 text-center border border-white">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Phí cho ăn</span>
                      <span className="text-sm font-black text-rose-500">-{lvlData.feedCost} Xu</span>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                      <span className="block text-[10px] font-bold text-amber-500 uppercase">Thưởng Lên Cấp</span>
                      <span className="text-sm font-black text-amber-600">+{lvlData.rewardCoins} Xu</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-sm font-medium text-slate-500">
              Hãy làm bài tập và nhiệm vụ hàng ngày để kiếm xu nuôi linh thú nhé!
            </p>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.5);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
