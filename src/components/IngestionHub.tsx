import React, { useState } from 'react';
import { School } from '../types/school';
import { PlusCircle, Sparkles } from 'lucide-react';
import { sounds } from '../sound/SoundManager';
import { GAME_BALANCE } from '../constants/balance';

interface IngestionHubProps {
  schools: School[];
  selectedSchoolId: number;
  onInjectPoints: (schoolId: number, points: number) => void;
}

export const IngestionHub: React.FC<IngestionHubProps> = ({
  schools,
  selectedSchoolId,
  onInjectPoints,
}) => {
  const [pointsInput, setPointsInput] = useState<number>(500);
  const [targetSchoolId, setTargetSchoolId] = useState<number>(selectedSchoolId);

  // Sync target with selected school if user hasn't overridden
  const activeSchool = schools.find(s => s.schoolId === targetSchoolId) || schools[0];
  const hasNightMarket = activeSchool?.activeBuffs.includes('NIGHT_MARKET_BONUS');
  const bonusMultiplier = hasNightMarket ? GAME_BALANCE.NIGHT_MARKET_BONUS_MULTIPLIER : 1.0;
  const finalTroops = Math.floor(pointsInput * bonusMultiplier);

  const handleInject = () => {
    if (pointsInput <= 0) return;
    sounds.playReinforcement();
    onInjectPoints(targetSchoolId, pointsInput);
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
          <span className="w-2 h-2 rounded-sm bg-[#00FFA3]" />
          <span>NẠP ĐIỂM HOẠT ĐỘNG SV (INGESTION HUB)</span>
        </span>
        <span className="text-[10px] font-mono-data text-[#8B949E]">
          TRỌNG TÀI
        </span>
      </div>

      {/* Select target school & points input */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <select
            value={targetSchoolId}
            onChange={e => setTargetSchoolId(Number(e.target.value))}
            className="flex-1 bg-[#0D1117] text-white border border-[#30363D] rounded px-2 py-1 text-[11px] font-mono-data focus:outline-none focus:border-[#00FFA3]"
          >
            {schools.map(s => (
              <option key={s.schoolId} value={s.schoolId}>
                {s.shortCode} - {s.name.split(' - ')[0]}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="10"
            step="50"
            value={pointsInput}
            onChange={e => setPointsInput(Math.max(1, Number(e.target.value)))}
            className="w-20 bg-[#0D1117] text-[#00FFA3] font-bold border border-[#30363D] rounded px-2 py-1 text-[11px] font-mono-data text-right focus:outline-none focus:border-[#00FFA3]"
          />
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1 font-mono-data text-[9px]">
          {[100, 500, 2000, 10000].map(amt => (
            <button
              key={amt}
              onClick={() => {
                sounds.playClick();
                setPointsInput(amt);
              }}
              className="bg-[#0D1117] hover:bg-[#21262D] border border-[#21262D] hover:border-[#30363D] rounded py-1 text-[#8B949E] hover:text-white transition text-center"
            >
              +{amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
        </div>

        {/* Bonus indicator if Night Market owned */}
        {hasNightMarket && (
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[rgba(250,219,20,0.1)] border border-[#FADB14]/40 text-[#FADB14] text-[10px] font-mono-data">
            <Sparkles className="w-3 h-3" />
            <span>Buff Chợ Đêm: +25% Viện Binh (+{finalTroops - pointsInput} quân)!</span>
          </div>
        )}

        {/* Inject Action Button */}
        <button
          onClick={handleInject}
          className="w-full bg-[#00FFA3]/15 hover:bg-[#00FFA3]/25 border border-[#00FFA3] text-[#00FFA3] hover:text-white font-tactical font-bold text-xs py-2 rounded flex items-center justify-center space-x-2 transition shadow-[0_0_10px_rgba(0,255,163,0.15)] group"
        >
          <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>NẠP +{finalTroops.toLocaleString()} QUÂN VIỆN BINH</span>
        </button>
      </div>
    </div>
  );
};
