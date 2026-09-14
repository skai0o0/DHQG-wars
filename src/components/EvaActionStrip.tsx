import React from 'react';
import { ActionMode } from '../types/game';
import { Zap, Shield, Crosshair, Search } from 'lucide-react';
import { sounds } from '../sound/SoundManager';

interface EvaActionStripProps {
  activeMode: ActionMode;
  onChangeMode: (mode: ActionMode) => void;
}

export const EvaActionStrip: React.FC<EvaActionStripProps> = ({
  activeMode,
  onChangeMode,
}) => {
  const modes: { mode: ActionMode; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      mode: 'expand',
      label: 'Khai Hoang',
      icon: <Zap className="w-3.5 h-3.5" />,
      desc: 'Click/kéo chuột trái vào đất trống tiếp giáp',
      color: 'text-[#00FFA3] border-[#00FFA3] bg-[rgba(0,255,163,0.15)]',
    },
    {
      mode: 'fortify',
      label: 'Cố Thủ',
      icon: <Shield className="w-3.5 h-3.5" />,
      desc: 'Click vào ô đồng minh để bổ sung +25 lính',
      color: 'text-[#58A6FF] border-[#58A6FF] bg-[rgba(88,166,255,0.15)]',
    },
    {
      mode: 'attack',
      label: 'Đánh Chiếm',
      icon: <Crosshair className="w-3.5 h-3.5" />,
      desc: 'Tấn công ô ranh giới của đối thủ',
      color: 'text-[#FF4D4F] border-[#FF4D4F] bg-[rgba(255,77,79,0.15)]',
    },
    {
      mode: 'inspect',
      label: 'Khảo Sát',
      icon: <Search className="w-3.5 h-3.5" />,
      desc: 'Xem chi tiết thông số ô mà không điều quân',
      color: 'text-[#FADB14] border-[#FADB14] bg-[rgba(250,219,20,0.15)]',
    },
  ];

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-tactical font-bold text-[11px] text-[#00FFA3] tracking-wide uppercase flex items-center space-x-1">
          <span className="w-2 h-2 rounded-sm bg-[#58A6FF]" />
          <span>CHẾ ĐỘ TÁC CHIẾN (EVA ACTION)</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {modes.map(m => {
          const isActive = activeMode === m.mode;
          return (
            <button
              key={m.mode}
              onClick={() => {
                sounds.playClick();
                onChangeMode(m.mode);
              }}
              className={`flex items-center space-x-1.5 px-2 py-2 rounded border font-mono-data text-[10px] font-bold transition-all ${
                isActive
                  ? m.color
                  : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D] hover:text-white'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-[#0D1117] p-1.5 rounded border border-[#21262D] text-[10px] text-[#8B949E] font-mono-data">
        {modes.find(m => m.mode === activeMode)?.desc}
      </div>
    </div>
  );
};
