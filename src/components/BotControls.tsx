import React from 'react';
import { Play, Pause, FastForward } from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface BotControlsProps {
  isAutoPlay: boolean;
  speed: number;
  onToggleAutoPlay: () => void;
  onChangeSpeed: (speed: number) => void;
}

export const BotControls: React.FC<BotControlsProps> = ({
  isAutoPlay,
  speed,
  onToggleAutoPlay,
  onChangeSpeed,
}) => {
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
          <span className="w-2 h-2 rounded-sm bg-[#FF4D4F]" />
          <span>MÔ PHỎNG BOT AI (SIMULATION)</span>
        </span>
        <span className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded border ${
          isAutoPlay
            ? 'bg-[#00FFA3]/10 border-[#00FFA3] text-[#00FFA3] animate-pulse'
            : 'bg-[#0D1117] border-[#21262D] text-[#8B949E]'
        }`}>
          {isAutoPlay ? 'ĐANG CHẠY' : 'DỪNG'}
        </span>
      </div>

      <div className="space-y-2">
        {/* Toggle Auto-Play Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleAutoPlay();
          }}
          className={`w-full py-2 px-3 rounded border font-tactical font-bold text-xs flex items-center justify-center space-x-2 transition ${
            isAutoPlay
              ? 'bg-[#FF4D4F]/20 border-[#FF4D4F] text-[#FF4D4F] hover:bg-[#FF4D4F]/30 shadow-[0_0_10px_rgba(255,77,79,0.2)]'
              : 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3] hover:bg-[#00FFA3]/30 shadow-[0_0_10px_rgba(0,255,163,0.2)]'
          }`}
        >
          {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isAutoPlay ? 'TẠM DỪNG MÔ PHỎNG BOT' : 'KÍCH HOẠT AUTO-PLAY AI'}</span>
        </button>

        {/* Speed Multiplier buttons */}
        <div className="flex items-center justify-between bg-[#0D1117] p-1 rounded border border-[#21262D]">
          <span className="text-[10px] text-[#8B949E] font-mono-data px-1 flex items-center space-x-1">
            <FastForward className="w-3 h-3 text-[#58A6FF]" />
            <span>Tốc độ:</span>
          </span>

          <div className="flex space-x-1">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => {
                  sounds.playClick();
                  onChangeSpeed(s);
                }}
                className={`px-2 py-0.5 rounded font-mono-data text-[10px] font-bold border transition ${
                  speed === s
                    ? 'bg-[#58A6FF] text-[#0D1117] border-[#58A6FF]'
                    : 'bg-[#161B22] text-[#8B949E] border-[#21262D] hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
