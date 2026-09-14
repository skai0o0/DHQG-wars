import React, { useRef, useEffect } from 'react';
import { School } from '../types/school';
import { TickerMessage } from '../types/game';
import { Trophy, Radio } from 'lucide-react';

interface BattleTickerProps {
  schools: School[];
  messages: TickerMessage[];
}

export const BattleTicker: React.FC<BattleTickerProps> = ({
  schools,
  messages,
}) => {
  const tickerBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    tickerBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sort schools for Top 5 Leaderboard
  const sortedSchools = [...schools].sort((a, b) => b.totalOwnedTiles - a.totalOwnedTiles).slice(0, 5);

  const getTypeStyle = (type: TickerMessage['type']) => {
    switch (type) {
      case 'capture': return 'text-[#FADB14] bg-[rgba(250,219,20,0.1)] border-[#FADB14]/30';
      case 'emblem': return 'text-[#00FFA3] bg-[rgba(0,255,163,0.1)] border-[#00FFA3]/30';
      case 'combat': return 'text-[#FF4D4F] bg-[rgba(255,77,79,0.1)] border-[#FF4D4F]/30';
      case 'reinforcement': return 'text-[#58A6FF] bg-[rgba(88,166,255,0.1)] border-[#58A6FF]/30';
      default: return 'text-[#8B949E] bg-[#0D1117] border-[#21262D]';
    }
  };

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs space-y-3">
      {/* Top 5 Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
            <Trophy className="w-3.5 h-3.5 text-[#FADB14]" />
            <span>BẢNG XẾP HẠNG THỊ PHẦN (TOP 5)</span>
          </span>
        </div>

        <div className="space-y-1.5 font-mono-data text-[10px]">
          {sortedSchools.map((s, idx) => {
            const pct = ((s.totalOwnedTiles / 1000000) * 100).toFixed(2);
            return (
              <div key={s.schoolId} className="bg-[#0D1117] p-1.5 rounded border border-[#21262D]">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className={`w-4 text-center font-bold ${idx === 0 ? 'text-[#FADB14]' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-[#8B949E]'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white truncate">{s.shortCode}</span>
                    {s.hasEmblemUnlocked && <span className="text-[#00FFA3]" title="Mega-Emblem 50x50">★</span>}
                  </div>
                  <div className="text-[#8B949E]">
                    <strong className="text-white">{s.totalOwnedTiles.toLocaleString()}</strong> ô ({pct}%)
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#161B22] h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(2, Math.min(100, Number(pct) * 10))}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Battle Ticker Log */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
            <Radio className="w-3.5 h-3.5 text-[#FF4D4F] animate-pulse" />
            <span>NHẬT KÝ CHIẾN TRƯỜNG (EVA TICKER)</span>
          </span>
        </div>

        <div className="h-28 overflow-y-auto bg-[#0D1117] p-1.5 rounded border border-[#21262D] space-y-1 font-mono-data text-[9px]">
          {messages.length === 0 ? (
            <div className="text-[#8B949E] italic text-center py-4">Đang dò tần số radio chiến trường...</div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`p-1 rounded border leading-tight ${getTypeStyle(msg.type)}`}
              >
                <span className="text-[#8B949E] mr-1">[{msg.timeString}]</span>
                <span>{msg.text}</span>
              </div>
            ))
          )}
          <div ref={tickerBottomRef} />
        </div>
      </div>
    </div>
  );
};
